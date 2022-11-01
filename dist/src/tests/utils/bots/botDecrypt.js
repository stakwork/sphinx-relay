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
exports.botDecrypt = void 0;
const rsa_1 = require("../../electronjs/rsa");
const get_1 = require("../get");
function botDecrypt(t, node, text, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        //CHECK THAT THE MESSAGE SENT BY BOT INCLUDES DESIRED TEXT ===>
        const lastMsg = yield get_1.getCheckNewMsgs(t, node, msg.uuid);
        //decrypt the last message sent to node using node private key and lastMsg content
        const decryptValue = rsa_1.decrypt(node.privkey, lastMsg.message_content);
        //the decrypted message should equal the random string input before encryption
        // console.log("TEXT === ", text)
        t.true(decryptValue.includes(text), 'decrypted bot text should include pre-encryption text');
        return true;
    });
}
exports.botDecrypt = botDecrypt;
//# sourceMappingURL=botDecrypt.js.map