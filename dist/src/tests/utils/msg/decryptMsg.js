"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptMessage = void 0;
const rsa = require("../../../crypto/rsa");
function decryptMessage(node, message) {
    const decrypt = rsa.decrypt(node.privkey, message.message_content);
    return decrypt;
}
exports.decryptMessage = decryptMessage;
//# sourceMappingURL=decryptMsg.js.map