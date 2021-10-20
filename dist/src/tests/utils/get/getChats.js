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
exports.getChats = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
function getChats(t, node1) {
    return __awaiter(this, void 0, void 0, function* () {
        //get list of contacts from node1 perspective
        const res = yield http.get(node1.external_ip + '/contacts', (0, helpers_1.makeArgs)(node1));
        t.truthy(res.response.chats);
        return res.response.chats;
    });
}
exports.getChats = getChats;
//# sourceMappingURL=getChats.js.map