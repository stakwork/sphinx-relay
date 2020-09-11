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
const node_fetch_1 = require("node-fetch");
const bitcoin_address_validation_1 = require("bitcoin-address-validation");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
const url = 'http://localhost:8081';
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', actions_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        const arr = message.content.split(' ');
        if (arr.length < 2)
            return;
        if (arr[0] !== '/loopout')
            return;
        if (arr.length === 3) { // loop
            const addy = arr[1];
            if (!bitcoin_address_validation_1.default(addy)) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('LoopBot')
                    .setDescription('Invalid BTC address');
                message.channel.send({ embed });
                return;
            }
            const amt = arr[2];
            if (!validateAmount(amt)) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('LoopBot')
                    .setDescription('Invalid amount');
                message.channel.send({ embed });
                return;
            }
            try {
                const r = yield node_fetch_1.default(url + '/v1/loop/out', {
                    method: 'POST',
                    body: JSON.stringify({
                        amt: amt,
                        dest: addy,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!r.ok)
                    return;
                // const j = await r.json()
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('LoopBot')
                    .setTitle('Loop Initialized!');
                message.channel.send({ embed });
            }
            catch (e) {
                console.log('Loop bot error', e);
            }
        }
        const cmd = arr[1];
        switch (cmd) {
            case 'help':
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('LoopBot')
                    .setTitle('LoopBot Commands:')
                    .addFields([
                    { name: 'Send to your on-chain address', value: '/loopout {ADDRESS} {AMOUNT}' },
                    { name: 'Help', value: '/loopout help' }
                ])
                    .setThumbnail(botSVG);
                message.channel.send({ embed });
                return;
            default:
                const embed2 = new Sphinx.MessageEmbed()
                    .setAuthor('LoopBot')
                    .setDescription('Command not recognized');
                message.channel.send({ embed: embed2 });
                return;
        }
    }));
}
exports.init = init;
const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`;
function validateAmount(amtString) {
    const amt = parseInt(amtString);
    const ok = amt > 0;
    return ok;
}
//# sourceMappingURL=loop.js.map