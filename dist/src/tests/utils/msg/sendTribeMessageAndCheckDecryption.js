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
exports.sendTribeMessageAndCheckDecryption = void 0;
const msg_1 = require("../msg");
// send a message
// and decrypt with node2 RSA key
// and check the text matches
function sendTribeMessageAndCheckDecryption(t, node1, node2, text, tribe, options) {
    return __awaiter(this, void 0, void 0, function* () {
        //send message from node1 to node2
        const msg = yield msg_1.sendTribeMessage(t, node1, tribe, text);
        const msgUuid = msg.uuid;
        yield msg_1.checkMessageDecryption(t, node2, msgUuid, text);
        return msg;
    });
}
exports.sendTribeMessageAndCheckDecryption = sendTribeMessageAndCheckDecryption;
//# sourceMappingURL=sendTribeMessageAndCheckDecryption.js.map