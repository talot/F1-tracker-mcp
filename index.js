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
/**
 * 1. MCP 서버 설정
 * 가이드에 따라 최신 스펙 버전(2025-03-26 이상)을 준수하도록 구성되었습니다.
 */
var server = new index_js_1.Server({
    name: "f1-tracker-mcp",
    version: "2025-03-26", // PlayMCP 가이드 권장 버전 형식 반영
}, { capabilities: { tools: {} } });
/**
 * 도구 목록 정의 (규격 준수: 영문, 숫자, 언더바 조합)
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
            }];
    });
}); });
/**
 * 실제 API 연동 로직
 */
server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name, args, response, data, races, scheduleInfo, response, data, teams, teamInfo, constructorId, response, data, drivers, driverInfo, response, data, standingsList, standings, standingsInfo, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = request.params, name = _a.name, args = _a.arguments;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 14, , 15]);
                if (!(name === "get_2026_schedule")) return [3 /*break*/, 4];
                return [4 /*yield*/, fetch("https://api.jolpi.ca/ergast/f1/2026.json")];
            case 2:
                response = _b.sent();
                return [4 /*yield*/, response.json()];
            case 3:
                data = _b.sent();
                races = data.MRData.RaceTable.Races;
                scheduleInfo = races.map(function (race) { return "\uB77C\uC6B4\uB4DC ".concat(race.round, ": ").concat(race.raceName, " (\uB0A0\uC9DC: ").concat(race.date, ")"); }).join('\n');
                return [2 /*return*/, { content: [{ type: "text", text: "2026\uB144 F1 \uC77C\uC815\uC785\uB2C8\uB2E4.\n".concat(scheduleInfo) }] }];
            case 4:
                if (!(name === "get_participating_teams")) return [3 /*break*/, 7];
                return [4 /*yield*/, fetch("https://api.jolpi.ca/ergast/f1/2026/constructors.json")];
            case 5:
                response = _b.sent();
                return [4 /*yield*/, response.json()];
            case 6:
                data = _b.sent();
                teams = data.MRData.ConstructorTable.Constructors;
                teamInfo = teams.map(function (team) { return "- ".concat(team.name, " (\uAD6D\uC801: ").concat(team.nationality, ")"); }).join('\n');
                return [2 /*return*/, { content: [{ type: "text", text: "2026\uB144 \uCC38\uAC00 \uD300\uC740 \uCD1D ".concat(teams.length, "\uAC1C \uD300\uC785\uB2C8\uB2E4.\n").concat(teamInfo) }] }];
            case 7:
                if (!(name === "get_team_drivers")) return [3 /*break*/, 10];
                constructorId = args.constructor_id;
                return [4 /*yield*/, fetch("https://api.jolpi.ca/ergast/f1/2026/constructors/".concat(constructorId, "/drivers.json"))];
            case 8:
                response = _b.sent();
                return [4 /*yield*/, response.json()];
            case 9:
                data = _b.sent();
                drivers = data.MRData.DriverTable.Drivers;
                if (!drivers || drivers.length === 0) {
                    return [2 /*return*/, { content: [{ type: "text", text: "해당 팀의 드라이버 정보를 찾을 수 없습니다. ID를 확인해 주세요." }] }];
                }
                driverInfo = drivers.map(function (d) { return "- ".concat(d.givenName, " ").concat(d.familyName, " (\uAD6D\uC801: ").concat(d.nationality, ")"); }).join('\n');
                return [2 /*return*/, { content: [{ type: "text", text: "\uC694\uCCAD\uD558\uC2E0 \uD300\uC758 \uB4DC\uB77C\uC774\uBC84 \uBA85\uB2E8\uC785\uB2C8\uB2E4:\n".concat(driverInfo) }] }];
            case 10:
                if (!(name === "get_driver_standings")) return [3 /*break*/, 13];
                return [4 /*yield*/, fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json")];
            case 11:
                response = _b.sent();
                return [4 /*yield*/, response.json()];
            case 12:
                data = _b.sent();
                standingsList = data.MRData.StandingsTable.StandingsLists[0];
                if (!standingsList)
                    return [2 /*return*/, { content: [{ type: "text", text: "순위 데이터가 아직 없습니다." }] }];
                standings = standingsList.DriverStandings;
                standingsInfo = standings.slice(0, 10).map(function (s) { var _a; return "".concat(s.position, "\uC704: ").concat(s.Driver.givenName, " ").concat(s.Driver.familyName, " (").concat((_a = s.Constructors[0]) === null || _a === void 0 ? void 0 : _a.name, ") - ").concat(s.points, "\uC810"); }).join('\n');
                return [2 /*return*/, { content: [{ type: "text", text: "\uD604\uC7AC \uB4DC\uB77C\uC774\uBC84 \uC21C\uC704 (Top 10):\n".concat(standingsInfo) }] }];
            case 13: throw new Error("알 수 없는 도구입니다.");
            case 14:
                error_1 = _b.sent();
                return [2 /*return*/, { content: [{ type: "text", text: "\uC5D0\uB7EC \uBC1C\uC0DD: ".concat(error_1) }], isError: true }];
            case 15: return [2 /*return*/];
        }
    });
}); });
/**
 * 2. 웹 서버 및 다중 세션 관리 (PlayMCP 가이드 준수)
 */
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
// 카카오 검증 시스템을 위한 Health Check 엔드포인트 추가
app.get("/", function (req, res) {
    res.status(200).send("F1 Tracker MCP Server is Healthy and Ready!");
});
var transports = new Map();
app.get("/sse", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var transport;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("새로운 SSE 연결 시도...");
                transport = new sse_js_1.SSEServerTransport("/messages", res);
                transports.set(transport.sessionId, transport);
                res.on("close", function () {
                    transports.delete(transport.sessionId);
                    console.log("\uC5F0\uACB0 \uC885\uB8CC (\uC138\uC158: ".concat(transport.sessionId, ")"));
                });
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
                if (!transport) {
                    res.status(404).send("Session not found");
                    return [2 /*return*/];
                }
                return [4 /*yield*/, transport.handlePostMessage(req, res)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
/**
 * 3. 서버 실행 및 자동 취침 방지 로직
 */
var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("\uD83D\uDE80 \uC11C\uBC84 \uC2E4\uD589 \uC911: \uD3EC\uD2B8 ".concat(PORT));
    // Render 무료 플랜의 'Spin-down'을 막기 위해 14분마다 자기 자신을 호출합니다.
    setInterval(function () {
        // 본인의 Render 실제 주소로 자동 변경되도록 설정 (포트 3000은 로컬용)
        var url = process.env.RENDER_EXTERNAL_URL || "http://localhost:".concat(PORT);
        fetch(url).then(function () { return console.log("Self-ping successful: Staying awake!"); }).catch(function () { });
    }, 14 * 60 * 1000);
});
