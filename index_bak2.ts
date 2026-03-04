import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "f1-tracker-mcp", version: "1.1.0" }, // 버전을 1.1.0으로 올렸습니다.
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_2026_schedule",
        description: "2026년 F1 시즌의 전체 그랑프리 경기 일정과 개막일을 조회합니다.",
        inputSchema: { type: "object", properties: {}, required: [] },
      },
      {
        name: "get_participating_teams",
        description: "2026년 F1 시즌에 참가하는 팀(컨스트럭터) 목록과 수를 조회합니다.",
        inputSchema: { type: "object", properties: {}, required: [] },
      },
      // 💡 새로 추가된 도구 1: 특정 팀 드라이버 조회
      {
        name: "get_team_drivers",
        description: "특정 F1 팀(컨스트럭터)의 2026 시즌 소속 드라이버 명단을 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            constructor_id: {
              type: "string",
              description: "조회할 팀의 영문 ID (예: red_bull, ferrari, mclaren, mercedes, aston_martin 등)"
            }
          },
          required: ["constructor_id"],
        },
      },
      // 💡 새로 추가된 도구 2: 현재 드라이버 순위
      {
        name: "get_driver_standings",
        description: "가장 최신(현재 시즌) F1 드라이버 챔피언십 포인트 순위를 조회합니다.",
        inputSchema: { type: "object", properties: {}, required: [] },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_2026_schedule") {
      const response = await fetch("https://api.jolpi.ca/ergast/f1/2026.json");
      const data = await response.json();
      const races = data.MRData.RaceTable.Races;
      const scheduleInfo = races.map((race: any) => `라운드 ${race.round}: ${race.raceName} (날짜: ${race.date})`).join('\n');
      return { content: [{ type: "text", text: `2026년 F1 일정입니다.\n${scheduleInfo}` }] };
    } 
    
    else if (name === "get_participating_teams") {
      const response = await fetch("https://api.jolpi.ca/ergast/f1/2026/constructors.json");
      const data = await response.json();
      const teams = data.MRData.ConstructorTable.Constructors;
      const teamInfo = teams.map((team: any) => `- ${team.name} (국적: ${team.nationality})`).join('\n');
      return { content: [{ type: "text", text: `2026년 참가 팀은 총 ${teams.length}개 팀입니다.\n${teamInfo}` }] };
    }

    // 💡 새로 추가된 로직 1: 특정 팀 드라이버 조회
    else if (name === "get_team_drivers") {
      const constructorId = (args as any).constructor_id;
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/2026/constructors/${constructorId}/drivers.json`);
      const data = await response.json();
      const drivers = data.MRData.DriverTable.Drivers;
      
      if (!drivers || drivers.length === 0) {
         return { content: [{ type: "text", text: "해당 팀의 드라이버 정보를 찾을 수 없거나 팀 ID가 올바르지 않습니다." }] };
      }
      
      const driverInfo = drivers.map((d: any) => `- ${d.givenName} ${d.familyName} (번호: ${d.permanentNumber}, 국적: ${d.nationality})`).join('\n');
      return { content: [{ type: "text", text: `요청하신 팀의 드라이버 명단입니다:\n${driverInfo}` }] };
    }

    // 💡 새로 추가된 로직 2: 현재 드라이버 순위
    else if (name === "get_driver_standings") {
      const response = await fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json");
      const data = await response.json();
      // 데이터가 없을 경우를 대비한 안전한 처리
      const standingsList = data.MRData.StandingsTable.StandingsLists[0];
      if (!standingsList) {
        return { content: [{ type: "text", text: "현재 순위 데이터가 아직 집계되지 않았습니다." }] };
      }

      const standings = standingsList.DriverStandings;
      const standingsInfo = standings.slice(0, 10).map((s: any) => 
        `${s.position}위: ${s.Driver.givenName} ${s.Driver.familyName} (${s.Constructors[0]?.name}) - ${s.points}점`
      ).join('\n');
      return { content: [{ type: "text", text: `현재 드라이버 챔피언십 순위 (Top 10):\n${standingsInfo}` }] };
    }

    throw new Error("알 수 없는 도구입니다.");
  } catch (error) {
    return {
      content: [{ type: "text", text: `데이터를 불러오는 중 오류가 발생했습니다: ${error}` }],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("F1 Tracker MCP Server running on stdio");
}

run().catch(console.error);
