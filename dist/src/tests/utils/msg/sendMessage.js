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
exports.sendMessage = void 0;
const http = require("ava-http");
const rsa = require("../../../crypto/rsa");
const get_1 = require("../get");
const helpers_1 = require("../helpers");
// send a message
// and decrypt with node2 RSA key
// and check the text matches
function sendMessage(t, node1, node2, text, options) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 SENDS TEXT MESSAGE TO NODE2
        const [node1contact, node2contact] = yield (0, get_1.getContactAndCheckKeyExchange)(t, node1, node2);
        //encrypt random string with node1 contact_key
        const encryptedText = rsa.encrypt(node1contact.contact_key, text);
        //encrypt random string with node2 contact_key
        const remoteText = rsa.encrypt(node2contact.contact_key, text);
        //create message object with encrypted texts
        const v = {
            contact_id: node2contact.id,
            chat_id: null,
            text: encryptedText,
            remote_text_map: { [node2contact.id]: remoteText },
            amount: (options && options.amount) || 0,
            reply_uuid: '',
            boost: false,
        };
        //send message from node1 to node2
        const msg = yield http.post(node1.external_ip + '/messages', (0, helpers_1.makeArgs)(node1, v));
        //make sure msg exists
        t.true(msg.success, 'msg should exist');
        return msg.response;
    });
}
exports.sendMessage = sendMessage;
//# sourceMappingURL=sendMessage.js.map