"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
// 💡 최신 Node.js 환경에서 fetch를 안전하게 참조합니다.
var nativeFetch = global.fetch;
/**
 * 1. MCP 서버 설정
 * 카카오 가이드의 최소 지원 버전(2025-03-26 이상)을 반영했습니다.
 */
var server = new index_js_1.Server({
    name: "f1-tracker-mcp",
    version: "2025-03-26",
}, { capabilities: { tools: {} } });
/**
 * 도구 목록 정의 (규격: 영문, 숫자, 언더바)
 */
server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
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
            }];
    });
}); });
/**
 * 도구 실행 로직 (표준 텍스트 응답 구조)
 */
server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name, args, url, response, data, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = request.params, name = _a.name, args = _a.arguments;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                url = "";
                if (name === "get_2026_schedule")
                    url = "https://api.jolpi.ca/ergast/f1/2026.json";
                else if (name === "get_participating_teams")
                    url = "https://api.jolpi.ca/ergast/f1/2026/constructors.json";
                else if (name === "get_team_drivers")
                    url = "https://api.jolpi.ca/ergast/f1/2026/constructors/".concat(args.constructor_id, "/drivers.json");
                else if (name === "get_driver_standings")
                    url = "https://api.jolpi.ca/ergast/f1/current/driverStandings.json";
                return [4 /*yield*/, nativeFetch(url)];
            case 2:
                response = _b.sent();
                return [4 /*yield*/, response.json()];
            case 3:
                data = _b.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "\uC870\uD68C \uACB0\uACFC \uB370\uC774\uD130\uC785\uB2C8\uB2E4: ".concat(JSON.stringify(data).slice(0, 2000))
                            }
                        ]
                    }];
            case 4:
                error_1 = _b.sent();
                return [2 /*return*/, {
                        content: [{ type: "text", text: "\uC5D0\uB7EC\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ".concat(error_1) }],
                        isError: true
                    }];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * 2. 웹 서버 및 다중 세션 관리 (PlayMCP 필수 사양)
 */
var app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*", methods: ["GET", "POST"] }));
app.use(express_1.default.json());
// 카카오 [정보 불러오기] 클릭 시 서버 상태 확인용 (Health Check)
app.get("/", function (req, res) {
    res.status(200).send("F1 Tracker MCP Server is Healthy and Ready!");
});
var transports = new Map();
app.get("/sse", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var transport;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                transport = new sse_js_1.SSEServerTransport("/messages", res);
                transports.set(transport.sessionId, transport);
                res.on("close", function () { return transports.delete(transport.sessionId); });
                return [4 /*yield*/, server.connect(transport)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
app.post("/messages", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, transport;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sessionId = req.query.sessionId;
                transport = transports.get(sessionId);
                if (!transport)
                    return [2 /*return*/, res.status(404).send("Session not found")];
                return [4 /*yield*/, transport.handlePostMessage(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
/**
 * 3. Render 포트 인식 및 자동 취침 방지
 */
var PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, "0.0.0.0", function () {
    console.log("\uD83D\uDE80 PlayMCP \uC804\uC6A9 \uC11C\uBC84\uAC00 \uD3EC\uD2B8 ".concat(PORT, "\uC5D0\uC11C \uC2E4\uD589 \uC911\uC785\uB2C8\uB2E4."));
    // 14분마다 자기 자신을 호출하여 서버가 잠들지 않도록 유지합니다.
    var selfUrl = "https://f1-tracker-mcp.onrender.com";
    setInterval(function () {
        nativeFetch(selfUrl).catch(function () { });
    }, 14 * 60 * 1000);
});
