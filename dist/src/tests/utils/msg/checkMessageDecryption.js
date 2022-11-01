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
exports.checkMessageDecryption = void 0;
const rsa = require("../../../crypto/rsa");
const get_1 = require("../get");
function checkMessageDecryption(t, node, msgUuid, text) {
    return __awaiter(this, void 0, void 0, function* () {
        // //wait for message to process
        const lastMessage = yield get_1.getCheckNewMsgs(t, node, msgUuid);
        t.truthy(lastMessage, 'await message post');
        //decrypt the last message sent to node using node private key and lastMessage content
        const decrypt = rsa.decrypt(node.privkey, lastMessage.message_content);
        //the decrypted message should equal the random string input before encryption
        t.true(decrypt === text, 'decrypted text should equal pre-encryption text');
        return true;
    });
}
exports.checkMessageDecryption = checkMessageDecryption;
//# sourceMappingURL=checkMessageDecryption.js.map