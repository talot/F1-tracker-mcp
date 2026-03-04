import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";

// 💡 최신 Node.js 환경에서 fetch를 안전하게 참조합니다.
const nativeFetch = (global as any).fetch;

/**
 * 1. MCP 서버 설정
 * 카카오 가이드의 최소 지원 버전(2025-03-26 이상)을 반영했습니다.
 */
const server = new Server(
  {
    name: "f1-tracker-mcp",
    version: "2025-03-26",
  },
  { capabilities: { tools: {} } }
);

/**
 * 도구 목록 정의 (규격: 영문, 숫자, 언더바)
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
              description: "팀 영문 ID (예: red_bull, ferrari, mclaren, audi 등)"
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
 * 도구 실행 로직 (표준 텍스트 응답 구조)
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let url = "";
    if (name === "get_2026_schedule") url = "https://api.jolpi.ca/ergast/f1/2026.json";
    else if (name === "get_participating_teams") url = "https://api.jolpi.ca/ergast/f1/2026/constructors.json";
    else if (name === "get_team_drivers") url = `https://api.jolpi.ca/ergast/f1/2026/constructors/${(args as any).constructor_id}/drivers.json`;
    else if (name === "get_driver_standings") url = "https://api.jolpi.ca/ergast/f1/current/driverStandings.json";

    const response = await nativeFetch(url);
    const data = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: `조회 결과 데이터입니다: ${JSON.stringify(data).slice(0, 2000)}`
        }
      ]
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `에러가 발생했습니다: ${error}` }],
      isError: true
    };
  }
});

/**
 * 2. 웹 서버 및 다중 세션 관리 (PlayMCP 필수 사양)
 */
const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// 카카오 [정보 불러오기] 클릭 시 서버 상태 확인용 (Health Check)
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
 * 3. Render 포트 인식 및 자동 취침 방지
 */
const PORT = Number(process.env.PORT) || 10000; 

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 PlayMCP 전용 서버가 포트 ${PORT}에서 실행 중입니다.`);
  
  // 14분마다 자기 자신을 호출하여 서버가 잠들지 않도록 유지합니다.
  const selfUrl = `https://f1-tracker-mcp.onrender.com`;
  setInterval(() => {
    nativeFetch(selfUrl).catch(() => {});
  }, 14 * 60 * 1000);
});
