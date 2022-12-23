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
exports.verifyActionHistorySaved = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const verifyActionHistorySaved = (searchTerm, node) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield http.get(node.external_ip + '/action_history', (0, helpers_1.makeArgs)(node));
    const actionHistories = result.response;
    for (let i = 0; i < actionHistories.length; i++) {
        const action = actionHistories[i];
        if (action.actionType === 1) {
            const meta_data = JSON.parse(action.metaData);
            if (meta_data.search_term === searchTerm) {
                return true;
            }
        }
    }
    return false;
});
exports.verifyActionHistorySaved = verifyActionHistorySaved;
//# sourceMappingURL=getActionHistory.js.map