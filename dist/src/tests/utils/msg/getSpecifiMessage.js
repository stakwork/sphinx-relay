"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecificMsg = void 0;
function getSpecificMsg(messages, uuid) {
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].uuid === uuid) {
            return messages[i];
        }
    }
}
exports.getSpecificMsg = getSpecificMsg;
//# sourceMappingURL=getSpecifiMessage.js.map