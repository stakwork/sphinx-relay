"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as Sphinx from '../../../sphinx-bot'
const Sphinx = require("sphinx-bot");
const MotherBot = require("./mother");
exports.MotherBot = MotherBot;
function init() {
    MotherBot.init();
}
exports.init = init;
function emit(content, chatUUID) {
    Sphinx._emit('message', { content, chatUUID });
}
exports.emit = emit;
//# sourceMappingURL=index.js.map