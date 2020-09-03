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
const Sphinx = require("sphinx-bot");
const actions_1 = require("../controllers/actions");
const msg_types = Sphinx.MSG_TYPE;
function init() {
    const client = new Sphinx.Client();
    client.login('_', embedToAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        console.log("INCOMING MSG", message);
        const embed = new Sphinx.MessageEmbed()
            .setAuthor('MotherBot')
            .setTitle('Bot Commands:')
            .addFields([
            { name: 'Install a new bot', value: '/bot install {BOTNAME}' },
            { name: 'Help', value: '/bot help' }
        ]);
        message.channel.send({ embed });
    }));
}
exports.init = init;
function embedToAction(a) {
    let text = '';
    let botName = 'Bot';
    if (a.embed && a.embed.html) {
        text = a.embed.html;
        botName = a.embed.author;
    }
    else if (typeof a === 'string') {
        text = a;
    }
    actions_1.finalAction({
        botName,
        text, action: 'broadcast',
    });
}
// const helpHTML=`<div>
//   <b>Bot commands:</b>
//   <ul>
//     <li><b>/bot install {BOTNAME}:</b>&nbsp;Install a new bot
//     <li><b>/bot help:</b>&nbsp;Print out this help message
//   </ul>
// <div>        
// `
//# sourceMappingURL=mother.js.map