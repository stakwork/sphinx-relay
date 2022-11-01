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
exports.clearAllContacts = void 0;
const ava_1 = require("ava");
const http = require("ava-http");
const helpers_1 = require("../utils/helpers");
const nodes_1 = require("../nodes");
/*
npx ava test-98-clearAllContacts.js --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test-98-clearAllContacts: clear all contacts from nodes', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield clearAllContacts(t);
}));
function clearAllContacts(t) {
    return __awaiter(this, void 0, void 0, function* () {
        //DELETE ALL CONTACTS ===>
        yield (0, helpers_1.asyncForEach)(nodes_1.default, (node) => __awaiter(this, void 0, void 0, function* () {
            if (!node)
                return;
            //get all contacts from node
            var res = yield http.get(node.external_ip + '/contacts?unmet=include', (0, helpers_1.makeArgs)(node));
            var contacts = res.response.contacts;
            t.truthy(contacts, 'should have at least one contact');
            if (contacts.length === 1) {
                console.log(`${node.alias} had no contacts`);
                return;
            }
            //delete any contact basides itself
            yield (0, helpers_1.asyncForEach)(contacts, (c) => __awaiter(this, void 0, void 0, function* () {
                if (c.public_key !== node.pubkey) {
                    let deletion = yield http.del(node.external_ip + '/contacts/' + c.id, (0, helpers_1.makeArgs)(node));
                    t.true(deletion.success, 'node should delete the contact');
                }
            }));
            console.log(`${node.alias} deleted all contacts`);
        }));
        return true;
    });
}
exports.clearAllContacts = clearAllContacts;
//# sourceMappingURL=clearAllContacts.test.js.map