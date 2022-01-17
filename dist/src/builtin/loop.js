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
exports.init = void 0;
const Sphinx = require("sphinx-bot");
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const constants_1 = require("../constants");
const child_process_1 = require("child_process");
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
const tribes_1 = require("../utils/tribes");
const config = (0, config_1.loadConfig)();
var validate = require('bitcoin-address-validation');
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
// const baseurl = 'https://localhost:8080'
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        if (!message.content)
            return;
        const arr = message.content.split(' ');
        if (arr.length < 2)
            return;
        if (arr[0] !== '/loopout')
            return;
        // check installed
        const bot = yield getBot(message.channel.id);
        if (!bot)
            return;
        const messageAmount = Number(message.amount) || 0;
        if (arr.length === 3) {
            // loop
            const addy = arr[1];
            if (!validate(addy)) {
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
            if (messageAmount < parseInt(amt)) {
                const embed = new Sphinx.MessageEmbed()
                    .setAuthor('LoopBot')
                    .setDescription('Incorrect amount');
                message.channel.send({ embed });
                return;
            }
            // try {
            //   const j = await doRequest(baseurl + '/v1/loop/out/quote/' + amt)
            //   console.log("=> LOOP QUOTE RES", j)
            //   if (!(j && j.swap_fee_sat && j.prepay_amt_sat)) {
            //     return
            //   }
            //   let chan
            //   const bot = await getBot(message.channel.id)
            //   if (bot && bot.meta) chan = bot.meta
            //   if (!chan) {
            //     const embed = new Sphinx.MessageEmbed()
            //       .setAuthor('LoopBot')
            //       .setDescription('No channel set')
            //     message.channel.send({ embed })
            //     return
            //   }
            //   const j2 = await doRequest(baseurl + '/v1/loop/out', {
            //     method: 'POST',
            //     body: JSON.stringify({
            //       amt: amt,
            //       dest: addy,
            //       outgoing_chan_set: [chan],
            //       max_swap_fee: j.swap_fee_sat,
            //       max_prepay_amt: j.prepay_amt_sat
            //     }),
            //   })
            //   console.log("=> LOOP RESPONSE", j2)
            //   if (j2 && j2.error) {
            //     const embed = new Sphinx.MessageEmbed()
            //       .setAuthor('LoopBot')
            //       .setDescription('Error: ' + j2.error)
            //     message.channel.send({ embed })
            //     return
            //   }
            //   // if (!(j2 && j2.server_message)) {
            //   //   return
            //   // }
            //   const embed = new Sphinx.MessageEmbed()
            //     .setAuthor('LoopBot')
            //     .setTitle('Payment was sent!')
            //     // .setDescription('Success!')
            //   message.channel.send({ embed })
            //   return
            // } catch (e) {
            //   console.log('LoopBot error', e)
            // }
            try {
                let chan;
                if (bot && bot.meta)
                    chan = bot.meta;
                if (!chan) {
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('LoopBot')
                        .setDescription('No channel set');
                    message.channel.send({ embed });
                    return;
                }
                const cmd = `loop`;
                const args = [
                    `--tlscertpath=${config.tls_location}`,
                    `--macaroonpath=${config.loop_macaroon_location}`,
                    `--rpcserver=localhost:10009`,
                    'out',
                    `--channel=${chan}`,
                    `--amt=${amt}`,
                    `--fast`,
                    `--addr=${addy}`,
                ];
                logger_1.sphinxLogger.info(`=> SPAWN ${cmd} ${args}`);
                let childProcess = (0, child_process_1.spawn)(cmd, args);
                childProcess.stdout.on('data', function (data) {
                    const stdout = data.toString();
                    logger_1.sphinxLogger.info(`LOOPBOT stdout: ${stdout}`);
                    if (stdout) {
                        logger_1.sphinxLogger.info(`=> LOOPBOT stdout ${stdout}`);
                        if (stdout.includes('CONTINUE SWAP?')) {
                            childProcess.stdin.write('y\n');
                        }
                        if (stdout.startsWith('Swap initiated')) {
                            const embed = new Sphinx.MessageEmbed()
                                .setAuthor('LoopBot')
                                .setTitle('Payment was sent!');
                            // .setDescription('Success!')
                            message.channel.send({ embed });
                            return;
                        }
                    }
                });
                childProcess.stderr.on('data', function (data) {
                    logger_1.sphinxLogger.error(`STDERR: ${data.toString()}`);
                });
                childProcess.on('error', (error) => {
                    logger_1.sphinxLogger.error(`error ${error.toString()}`);
                });
                childProcess.on('close', (code) => {
                    logger_1.sphinxLogger.info(`CHILD PROCESS closed ${code}`);
                });
            }
            catch (e) {
                logger_1.sphinxLogger.error(`LoopBot error ${e}`);
            }
        }
        else {
            const cmd = arr[1];
            const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
            if (isAdmin && cmd.startsWith('setchan=')) {
                const bot = yield getBot(message.channel.id);
                const arr = cmd.split('=');
                if (bot && arr.length > 1) {
                    const chan = arr[1];
                    yield bot.update({ meta: chan });
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('LoopBot')
                        .setDescription('Channel updated to ' + chan)
                        .setThumbnail(botSVG);
                    message.channel.send({ embed });
                    return;
                }
            }
            switch (cmd) {
                case 'help':
                    const embed = new Sphinx.MessageEmbed()
                        .setAuthor('LoopBot')
                        .setTitle('LoopBot Commands:')
                        .addFields([
                        {
                            name: 'Send to your on-chain address',
                            value: '/loopout {ADDRESS} {AMOUNT}',
                        },
                        { name: 'Set Channel', value: '/loopout setchan=***' },
                        { name: 'Help', value: '/loopout help' },
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
        } // end else
    }));
}
exports.init = init;
function getBot(tribeUUID) {
    return __awaiter(this, void 0, void 0, function* () {
        const chat = yield (0, tribes_1.getTribeOwnersChatByUUID)(tribeUUID);
        if (!chat)
            return;
        return yield models_1.models.ChatBot.findOne({
            where: {
                chatId: chat.id,
                botPrefix: '/loopout',
                botType: constants_1.default.bot_types.builtin,
                tenant: chat.tenant,
            },
        });
    });
}
const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`;
function validateAmount(amtString) {
    const amt = parseInt(amtString);
    const ok = amt > 0;
    return ok;
}
// const fs = require('fs')
// const https = require("https");
// const homedir = require('os').homedir();
// const agent = new https.Agent({
//   rejectUnauthorized: false
// })
// async function doRequest(theurl: string, params?: Object) {
//   const ps = params || {}
//   try {
//     const macLocation = config.loop_macaroon_location
//     if (!macLocation) {
//       throw new Error('no macaroon')
//     }
//     var macaroonString = fs.readFileSync(macLocation);
//     var mac = Buffer.from(macaroonString, 'utf8').toString('hex');
//     const theParams = {
//       agent,
//       headers: {
//         'Grpc-Metadata-macaroon': mac
//       },
//       ...ps
//     }
//     const r = await fetch(theurl, theParams)
//     const j = await r.json()
//     return j
//   } catch (e) {
//     throw e
//   }
// }
//# sourceMappingURL=loop.js.map