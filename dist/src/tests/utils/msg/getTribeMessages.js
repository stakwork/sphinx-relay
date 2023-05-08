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
exports.getTribeMessages = void 0;
const index_1 = require("./index");
function getTribeMessages(t, node, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        const allMessages = yield (0, index_1.getAllMessages)(node);
        let tribeMessages = [];
        for (let i = 0; i < allMessages.length; i++) {
            const message = allMessages[i];
            if (tribe.id === message.chat_id) {
                tribeMessages.push(message);
            }
        }
        return tribeMessages;
    });
}
exports.getTribeMessages = getTribeMessages;
//# sourceMappingURL=getTribeMessages.js.map