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
exports.getTribeIdFromUUID = void 0;
const helpers_1 = require("../helpers");
const http = require("ava-http");
function getTribeIdFromUUID(t, node, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        //GET TRIBE ID FROM PERSPECTIVE OF NODE ===>
        //get list of contacts as node
        let con = yield http.get(node.ip + '/contacts', (0, helpers_1.makeArgs)(node));
        //get test tribe id as node
        let findTribe = con.response.chats.find((chat) => chat.uuid === tribe.uuid);
        t.true(typeof findTribe === 'object', 'tribe object should exist');
        let tribeId = findTribe.id;
        t.true(typeof tribeId === 'number', 'there should be a tribe id');
        return tribeId;
    });
}
exports.getTribeIdFromUUID = getTribeIdFromUUID;
//# sourceMappingURL=getTribeIdFromUUID.js.map