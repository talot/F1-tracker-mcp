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
// 💡 node-fetch 에러를 피하기 위해 전역 fetch를 안전하게 참조합니다.
var nativeFetch = global.fetch;
var server = new index_js_1.Server({ name: "f1-tracker-mcp", version: "2025-03-26" }, { capabilities: { tools: {} } });
/** 도구 목록 및 실행 로직 (기존과 동일) **/
server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
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
            }];
    });
}); });
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
                // 간략화된 응답 (과장님은 기존의 상세 로직을 그대로 쓰셔도 무방합니다)
                return [2 /*return*/, { content: [{ type: "text", text: JSON.stringify(data, null, 2).slice(0, 1000) }] }];
            case 4:
                error_1 = _b.sent();
                return [2 /*return*/, { content: [{ type: "text", text: "\uC5D0\uB7EC: ".concat(error_1) }], isError: true }];
            case 5: return [2 /*return*/];
        }
    });
}); });
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", function (req, res) { res.status(200).send("F1 Tracker MCP Healthy!"); });
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
/** 💡 에러 해결 핵심: 포트 번호를 명시적으로 '숫자'로 변환합니다. **/
var PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, "0.0.0.0", function () {
    console.log("\uD83D\uDE80 \uC11C\uBC84 \uC2E4\uD589 \uC911: \uD3EC\uD2B8 ".concat(PORT));
    // 자가 기상 로직
    var selfUrl = process.env.RENDER_EXTERNAL_URL || "https://f1-tracker-mcp.onrender.com";
    setInterval(function () { nativeFetch(selfUrl).catch(function () { }); }, 14 * 60 * 1000);
});
