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
exports.sendInvoice = void 0;
const http = require("ava-http");
const helpers_1 = require("../../utils/helpers");
const rsa_1 = require("../../electronjs/rsa");
const get_1 = require("../get");
function sendInvoice(t, node1, node2, amount, text) {
    return __awaiter(this, void 0, void 0, function* () {
        //SEND INVOICE FROM NODE1 TO NODE2 ===>
        let [node1contact, node2contact] = yield get_1.getCheckContacts(t, node1, node2);
        //encrypt random string with node1 contact_key
        const encryptedText = rsa_1.encrypt(node1contact.contact_key, text);
        //encrypt random string with node2 contact_key
        const remoteText = rsa_1.encrypt(node2contact.contact_key, text);
        //create node2 contact id
        let contact_id = node2contact.id;
        let destination_key = '';
        //create payment object
        const v = {
            contact_id: contact_id || null,
            chat_id: null,
            amount: amount,
            destination_key,
            text: encryptedText,
            remote_text: remoteText,
        };
        //post payment from node1 to node2
        const r = yield http.post(node1.external_ip + '/invoices', helpers_1.makeArgs(node1, v));
        t.true(r.success, 'invoice should have been posted');
        return r;
    });
}
exports.sendInvoice = sendInvoice;
//# sourceMappingURL=sendInvoice.js.map