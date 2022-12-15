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
exports.buildBotPayload = exports.builtinBotEmit = exports.init = void 0;
// import * as SphinxBot from '../../../sphinx-bot'
const SphinxBot = require("sphinx-bot");
const MotherBot = require("./mother");
const WelcomeBot = require("./welcome");
const LoopBot = require("./loop");
const BadgeBot = require("./badge");
const GitBot = require("./git");
const bots_1 = require("../controllers/bots");
Object.defineProperty(exports, "buildBotPayload", { enumerable: true, get: function () { return bots_1.buildBotPayload; } });
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        MotherBot.init();
        WelcomeBot.init();
        LoopBot.init();
        GitBot.init();
        BadgeBot.init();
    });
}
exports.init = init;
function builtinBotEmit(msg) {
    setTimeout(() => {
        SphinxBot._emit('message', (0, bots_1.buildBotPayload)(msg));
    }, 1200);
}
exports.builtinBotEmit = builtinBotEmit;
//# sourceMappingURL=index.js.map