import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";

// 💡 node-fetch 에러를 피하기 위해 전역 fetch를 안전하게 참조합니다.
const nativeFetch = (global as any).fetch;

const server = new Server(
  { name: "f1-tracker-mcp", version: "2025-03-26" },
  { capabilities: { tools: {} } }
);

/** 도구 목록 및 실행 로직 (기존과 동일) **/
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      { name: "get_2026_schedule", description: "2026 F1 일정 조회", inputSchema: { type: "object", properties: {}, required: [] } },
      { name: "get_participating_teams", description: "2026 F1 참가 팀 조회", inputSchema: { type: "object", properties: {}, required: [] } },
      {
        name: "get_team_drivers",
        description: "특정 F1 팀 드라이버 조회",
        inputSchema: {
          type: "object",
          properties: { constructor_id: { type: "string" } },
          required: ["constructor_id"],
        },
      },
      { name: "get_driver_standings", description: "현재 드라이버 순위 조회", inputSchema: { type: "object", properties: {}, required: [] } }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let url = "";
    if (name === "get_2026_schedule") url = "https://api.jolpi.ca/ergast/f1/2026.json";
    else if (name === "get_participating_teams") url = "https://api.jolpi.ca/ergast/f1/2026/constructors.json";
    else if (name === "get_team_drivers") url = `https://api.jolpi.ca/ergast/f1/2026/constructors/${(args as any).constructor_id}/drivers.json`;
    else if (name === "get_driver_standings") url = "https://api.jolpi.ca/ergast/f1/current/driverStandings.json";

    const response = await nativeFetch(url); // 수정된 fetch 사용
    const data = await response.json();
    
    // 간략화된 응답 (과장님은 기존의 상세 로직을 그대로 쓰셔도 무방합니다)
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2).slice(0, 1000) }] };
  } catch (error) {
    return { content: [{ type: "text", text: `에러: ${error}` }], isError: true };
  }
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => { res.status(200).send("F1 Tracker MCP Healthy!"); });

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

/** 💡 에러 해결 핵심: 포트 번호를 명시적으로 '숫자'로 변환합니다. **/
const PORT = Number(process.env.PORT) || 10000; 

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 서버 실행 중: 포트 ${PORT}`);
  
  // 자가 기상 로직
  const selfUrl = process.env.RENDER_EXTERNAL_URL || `https://f1-tracker-mcp.onrender.com`;
  setInterval(() => { nativeFetch(selfUrl).catch(() => {}); }, 14 * 60 * 1000);
});
