import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// MCP 서버 초기화
const server = new Server(
  { name: "f1-tracker-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 1. AI에게 제공할 도구(Tool) 목록 정의
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
      }
    ],
  };
});

// 2. AI가 도구를 호출했을 때 실행될 실제 로직 (Jolpi API 연동)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  try {
    if (name === "get_2026_schedule") {
      // 2026년 일정 호출
      const response = await fetch("https://api.jolpi.ca/ergast/f1/2026.json");
      const data = await response.json();
      const races = data.MRData.RaceTable.Races;
      
      const scheduleInfo = races.map((race: any) => 
        `라운드 ${race.round}: ${race.raceName} (날짜: ${race.date})`
      ).join('\n');

      return {
        content: [{ type: "text", text: `2026년 F1 일정입니다.\n${scheduleInfo}` }],
      };
    } 
    
    else if (name === "get_participating_teams") {
      // 2026년 참가 팀(컨스트럭터) 호출
      const response = await fetch("https://api.jolpi.ca/ergast/f1/2026/constructors.json");
      const data = await response.json();
      const teams = data.MRData.ConstructorTable.Constructors;
      
      const teamInfo = teams.map((team: any) => `- ${team.name} (국적: ${team.nationality})`).join('\n');

      return {
        content: [{ type: "text", text: `2026년 참가 팀은 총 ${teams.length}개 팀입니다.\n${teamInfo}` }],
      };
    }

    throw new Error("알 수 없는 도구입니다.");
  } catch (error) {
    return {
      content: [{ type: "text", text: `데이터를 불러오는 중 오류가 발생했습니다: ${error}` }],
      isError: true,
    };
  }
});

// 3. 서버 실행
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("F1 Tracker MCP Server running on stdio");
}

run().catch(console.error);
