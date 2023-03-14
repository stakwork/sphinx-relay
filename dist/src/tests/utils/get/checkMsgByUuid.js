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
exports.getMsgByUuid = void 0;
const getCheckAllMessages_1 = require("./getCheckAllMessages");
function getMsgByUuid(t, node1, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const msg = yield (0, getCheckAllMessages_1.getCheckAllMessages)(t, node1, 1000, 0);
        if (msg && msg.new_messages && msg.new_messages.length) {
            for (let i = 0; i < msg.new_messages.length; i++) {
                const newMsg = msg.new_messages[i];
                if (newMsg.uuid === message.uuid) {
                    return true;
                }
            }
            return false;
        }
        else {
            return false;
        }
    });
}
exports.getMsgByUuid = getMsgByUuid;
//# sourceMappingURL=checkMsgByUuid.js.map