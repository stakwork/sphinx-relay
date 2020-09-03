"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Sphinx = require("sphinx-bot");
const MotherBot = require("./mother");
exports.MotherBot = MotherBot;
function init() {
    MotherBot.init();
}
exports.init = init;
function emit(txt, chatUUID) {
    const arr = txt.split(' ');
    if (arr.length < 2)
        return false;
    // const cmd = arr[1]
    Sphinx.EE.emit('message', { content: txt, chatUUID });
    // switch(cmd) {
    //   case 'install':
    //     if(arr.length<3) return false
    //     // installBot(arr[2], botInTribe)
    //     return true
    //   default:
    //     Sphinx.EE.emit('message',cmd,chatUUID)
    // } 
}
exports.emit = emit;
//# sourceMappingURL=index.js.map