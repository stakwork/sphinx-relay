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
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveActionHistory = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const saveActionHistory = (t, search, node) => __awaiter(void 0, void 0, void 0, function* () {
    const body = {
        type: 1,
        meta_data: {
            frequency: 1,
            search_term: search,
            current_timestamp: Math.floor(Date.now() / 1000),
        },
    };
    const action = yield http.post(node.external_ip + '/action_history', (0, helpers_1.makeArgs)(node, body));
    t.true(action.success, 'Action History saved successfully');
    return true;
});
exports.saveActionHistory = saveActionHistory;
//# sourceMappingURL=actionHistory.js.map