import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";

/**
 * 1. MCP 서버 설정
 * 가이드에 따라 최신 스펙 버전(2025-03-26 이상)을 준수하도록 구성되었습니다.
 */
const server = new Server(
  {
    name: "f1-tracker-mcp",
    version: "2025-03-26", // PlayMCP 가이드 권장 버전 형식 반영
  },
  { capabilities: { tools: {} } }
);

/**
 * 도구 목록 정의 (규격 준수: 영문, 숫자, 언더바 조합)
 */
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
      {
        name: "get_team_drivers",
        description: "특정 F1 팀의 2026 시즌 소속 드라이버 명단을 조회합니다.",
        inputSchema: {
          type: "object",
          properties: {
            constructor_id: {
              type: "string",
              description: "팀 영문 ID (예: red_bull, ferrari, mclaren, mercedes, audi, cadillac 등)"
            }
          },
          required: ["constructor_id"],
        },
      },
      {
        name: "get_driver_standings",
        description: "가장 최신의 F1 드라이버 챔피언십 포인트 순위를 조회합니다.",
        inputSchema: { type: "object", properties: {}, required: [] },
      }
    ],
  };
});

/**
 * 실제 API 연동 로직
 */
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
    else if (name === "get_team_drivers") {
      const constructorId = (args as any).constructor_id;
      const response = await fetch(`https://api.jolpi.ca/ergast/f1/2026/constructors/${constructorId}/drivers.json`);
      const data = await response.json();
      const drivers = data.MRData.DriverTable.Drivers;
      
      if (!drivers || drivers.length === 0) {
         return { content: [{ type: "text", text: "해당 팀의 드라이버 정보를 찾을 수 없습니다. ID를 확인해 주세요." }] };
      }
      
      const driverInfo = drivers.map((d: any) => `- ${d.givenName} ${d.familyName} (국적: ${d.nationality})`).join('\n');
      return { content: [{ type: "text", text: `요청하신 팀의 드라이버 명단입니다:\n${driverInfo}` }] };
    }
    else if (name === "get_driver_standings") {
      const response = await fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json");
      const data = await response.json();
      const standingsList = data.MRData.StandingsTable.StandingsLists[0];
      if (!standingsList) return { content: [{ type: "text", text: "순위 데이터가 아직 없습니다." }] };

      const standings = standingsList.DriverStandings;
      const standingsInfo = standings.slice(0, 10).map((s: any) => 
        `${s.position}위: ${s.Driver.givenName} ${s.Driver.familyName} (${s.Constructors[0]?.name}) - ${s.points}점`
      ).join('\n');
      return { content: [{ type: "text", text: `현재 드라이버 순위 (Top 10):\n${standingsInfo}` }] };
    }
    throw new Error("알 수 없는 도구입니다.");
  } catch (error) {
    return { content: [{ type: "text", text: `에러 발생: ${error}` }], isError: true };
  }
});

/**
 * 2. 웹 서버 및 다중 세션 관리 (PlayMCP 가이드 준수)
 */
const app = express();
app.use(cors());

// 카카오 검증 시스템을 위한 Health Check 엔드포인트 추가
app.get("/", (req, res) => {
  res.status(200).send("F1 Tracker MCP Server is Healthy and Ready!");
});

const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res) => {
  console.log("새로운 SSE 연결 시도...");
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  
  res.on("close", () => {
    transports.delete(transport.sessionId);
    console.log(`연결 종료 (세션: ${transport.sessionId})`);
  });

  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }
  await transport.handlePostMessage(req, res);
});

/**
 * 3. 서버 실행 및 자동 취침 방지 로직
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
  
  // Render 무료 플랜의 'Spin-down'을 막기 위해 14분마다 자기 자신을 호출합니다.
  setInterval(() => {
    // 본인의 Render 실제 주소로 자동 변경되도록 설정 (포트 3000은 로컬용)
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    fetch(url).then(() => console.log("Self-ping successful: Staying awake!")).catch(() => {});
  }, 14 * 60 * 1000);
});
