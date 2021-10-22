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
exports.joinTribe = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const get_1 = require("../get");
function joinTribe(t, node, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE JOINS TRIBE ===>
        //node joins tribe
        const join = yield http.post(node.ip + '/tribe', (0, helpers_1.makeArgs)(node, tribe));
        //check that join was successful
        t.true(join.success, 'node2 should join test tribe');
        const joinedTribeId = join.response.id;
        //await arrival of new tribe in chats
        const check = yield (0, get_1.getCheckTribe)(t, node, joinedTribeId);
        t.truthy(check, 'joined tribe should be in chats');
        return true;
    });
}
exports.joinTribe = joinTribe;
//# sourceMappingURL=joinTribe.js.map