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
exports.leaveTribe = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const get_1 = require("../get");
function leaveTribe(t, node, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        const tribeId = yield get_1.getTribeIdFromUUID(t, node, tribe);
        t.true(typeof tribeId === 'number', 'node should get tribe id');
        //node2 leaves tribe
        const exit = yield http.del(node.external_ip + `/chat/${tribeId}`, helpers_1.makeArgs(node));
        //check exit
        t.true(exit.success, 'node should exit test tribe');
        return true;
    });
}
exports.leaveTribe = leaveTribe;
//# sourceMappingURL=leaveTribe.js.map