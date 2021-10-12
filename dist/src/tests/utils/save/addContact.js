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
exports.addContact = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const get_1 = require("../get");
function addContact(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //object of node2node for adding as contact
        const body = {
            alias: `${node2.alias}`,
            public_key: node2.pubkey,
            status: 1,
            route_hint: node2.routeHint || '',
        };
        //node1 adds node2 as contact
        const add = yield http.post(node1.external_ip + '/contacts', helpers_1.makeArgs(node1, body));
        t.true(typeof add.response === 'object', 'add contact should return object');
        //create node2 id based on the post response
        var node2id = add && add.response && add.response.id;
        //check that node2id is a number and therefore exists (contact was posted)
        t.true(typeof node2id === 'number', 'node1id should be a number');
        //await contact_key
        const [n1contactP1, n2contactP1] = yield get_1.getContactAndCheckKeyExchange(t, node1, node2);
        //make sure node 2 has the contact_key
        t.true(typeof n2contactP1.contact_key === 'string', 'node2 should have a contact key');
        t.true(typeof n1contactP1 === 'object', 'node1 should be its own first contact');
        return true;
    });
}
exports.addContact = addContact;
//# sourceMappingURL=addContact.js.map