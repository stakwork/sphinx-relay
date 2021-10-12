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
exports.getContacts = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
function getContacts(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //get list of contacts from node1 perspective
        const res = yield http.get(node1.external_ip + '/contacts?unmet=include', helpers_1.makeArgs(node1));
        //create node1 contact object from node1 perspective
        let n1contactP1 = res.response.contacts.find((contact) => contact.public_key === node1.pubkey);
        t.true(typeof n1contactP1 === 'object');
        if (node2) {
            //create node1 contact object from node2 perspective
            let n2contactP1 = res.response.contacts.find((contact) => contact.public_key === node2.pubkey);
            t.true(typeof n2contactP1 === 'object');
        }
        return res.response.contacts;
    });
}
exports.getContacts = getContacts;
//# sourceMappingURL=getContacts.js.map