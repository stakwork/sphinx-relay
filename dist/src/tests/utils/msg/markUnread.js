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
exports.markUnread = void 0;
const helpers_1 = require("../helpers");
const http = require("ava-http");
function markUnread(node, chat_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const msg = yield http.post(node.external_ip + `/messages/${chat_id.id}/toggleChatReadUnread`, (0, helpers_1.makeArgs)(node, { shouldMarkAsUnread: true }));
        return msg.response.new_messages;
    });
}
exports.markUnread = markUnread;
//# sourceMappingURL=markUnread.js.map