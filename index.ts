import fetch from "node-fetch";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";

/**
 * 1. MCP 서버 설정
 * 카카오 가이드의 최소 지원 버전(2025-03-26)을 이름에 반영했습니다.
 */
const server = new Server(
  {
    name: "f1-tracker-mcp",
    version: "2025-03-26",
  },
  { capabilities: { tools: {} } }
);

/**
 * 도구 목록 정의
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
        description: "2026년 F1 시즌에 참가하는 팀 목록과 수를 조회합니다.",
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
              description: "팀 영문 ID (예: red_bull, ferrari, mclaren, mercedes, audi 등)"
            }
          },
          required: ["constructor_id"],
        },
      },
      {
        name: "get_driver_standings",
        description: "현재 시즌 F1 드라이버 챔피언십 포인트 순위를 조회합니다.",
        inputSchema: { type: "object", properties: {}, required: [] },
      }
    ],
  };
});

/**
 * 도구 실행 로직
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
         return { content: [{ type: "text", text: "해당 팀 정보를 찾을 수 없습니다." }] };
      }
      
      const driverInfo = drivers.map((d: any) => `- ${d.givenName} ${d.familyName} (번호: ${d.permanentNumber})`).join('\n');
      return { content: [{ type: "text", text: `소속 드라이버 명단입니다:\n${driverInfo}` }] };
    }
    else if (name === "get_driver_standings") {
      const response = await fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json");
      const data = await response.json();
      const standingsList = data.MRData.StandingsTable.StandingsLists[0];
      if (!standingsList) return { content: [{ type: "text", text: "순위 데이터가 없습니다." }] };

      const standingsInfo = standingsList.DriverStandings.slice(0, 10).map((s: any) => 
        `${s.position}위: ${s.Driver.givenName} ${s.Driver.familyName} - ${s.points}점`
      ).join('\n');
      return { content: [{ type: "text", text: `현재 드라이버 순위:\n${standingsInfo}` }] };
    }
    throw new Error("알 수 없는 도구");
  } catch (error) {
    return { content: [{ type: "text", text: `에러: ${error}` }], isError: true };
  }
});

/**
 * 2. 웹 서버 및 다중 세션 관리
 */
const app = express();

// CORS 설정을 보강하여 PlayMCP의 접근을 허용합니다.
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// 카카오 검증용 Health Check
app.get("/", (req, res) => {
  res.status(200).send("F1 Tracker MCP Server is Healthy and Ready!");
});

const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  res.on("close", () => transports.delete(transport.sessionId));
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) return res.status(404).send("Session not found");
  await transport.handlePostMessage(req, res);
});

/**
 * 3. Render 포트 자동 인식 및 실행
 */
const PORT = process.env.PORT || 10000; // Render의 기본 포트 10000 사용
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 PlayMCP 전용 서버가 포트 ${PORT}에서 실행 중입니다.`);
  
  // 14분마다 자기 자신을 찔러서 잠들지 않게 합니다.
  const selfUrl = process.env.RENDER_EXTERNAL_URL || `https://f1-tracker-mcp.onrender.com`;
  setInterval(() => {
    fetch(selfUrl).catch(() => {});
  }, 14 * 60 * 1000);
});
