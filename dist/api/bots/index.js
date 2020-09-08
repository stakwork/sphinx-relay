"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as SphinxBot from '../../../sphinx-bot'
const SphinxBot = require("sphinx-bot");
const MotherBot = require("./mother");
function init() {
    MotherBot.init();
}
exports.init = init;
function builtinBotEmit(msg) {
    SphinxBot._emit('message', {
        channel: {
            id: msg.chat.uuid,
            send: function () { },
        },
        reply: function () { },
        content: msg.message.content,
        type: msg.type,
    });
}
exports.builtinBotEmit = builtinBotEmit;
//# sourceMappingURL=index.js.map