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
const logger_1 = require("../utils/logger");
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const constants_1 = require("../constants");
const node_fetch_1 = require("node-fetch");
/**
 *
 ** TODO **
 * Check for when a meeting link is shared *
 * Check if call recording is authorized for this tribe
 * If call is authorized, store the call id in the table to track it, store who created the call and update the state of the call
 * write a simple function to see if the the tribe has a meme_server_address, stakwork api key and webhook
 * if it does, the function keeps hitting the meme_server to see if there is a file with the call id as file name
 * if it finds a file, send that file to stakwork and update the status to 'stored'
 * if after 3 hours no file is found the bot throws an error message (the 3 hours is just temporal for now)
 * **/
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        try {
            const tribe = (yield models_1.models.Chat.findOne({
                where: { uuid: message.channel.id },
            }));
            if (message.content) {
                let jitsiServer = message.content.substring(0, tribe.jitsiServer.length);
                let callId = message.content.substring(tribe.jitsiServer.length, message.content.length);
                let updatedCallId = callId.split('#')[0];
                if (updatedCallId[0] === '/') {
                    updatedCallId = updatedCallId.substring(1, updatedCallId.length);
                }
                if (tribe.callRecording === 1 &&
                    tribe.jitsiServer.length !== 0 &&
                    tribe.jitsiServer === jitsiServer &&
                    tribe.memeServerLocation &&
                    tribe.stakworkApiKey &&
                    tribe.stakworkWebhook) {
                    const callRecord = (yield models_1.models.CallRecording.create({
                        recordingId: updatedCallId,
                        chatId: tribe.id,
                        createdBy: message.member.id,
                        status: constants_1.default.call_status.new,
                    }));
                    let timeActive = 0;
                    const interval = setInterval(function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            timeActive += 60000;
                            const file = yield (0, node_fetch_1.default)(`${tribe.memeServerLocation}`, {
                                method: 'GET',
                                headers: { 'Content-Type': 'application/json' },
                            });
                            // If recording is found
                            if (file.ok) {
                                console.log('File was gotten successfully');
                                // Push to stakwork
                                //   const sendFile = await fetch(`${tribe.memeServerLocation}`, {
                                //     method: 'POST',
                                //     headers: {
                                //       'Content-Type': 'application/json',
                                //       Authorization: `Bearer ${tribe.stakworkApiKey}`,
                                //     },
                                //     body: JSON.stringify({
                                //       webhook: tribe.stakworkWebhook,
                                //     }),
                                //   })
                                //   console.log(sendFile)
                                //update call record to stored
                                callRecord.update({ status: constants_1.default.call_status.stored });
                                clearInterval(interval);
                                const embed = new Sphinx.MessageEmbed()
                                    .setAuthor('CallRecordingBot')
                                    .setDescription('Call was recorded successfully');
                                message.channel.send({ embed });
                                return;
                            }
                            // If recording not found after specified time then it returns an error
                            if (timeActive === 180000 && !file.ok) {
                                clearInterval(interval);
                                const embed = new Sphinx.MessageEmbed()
                                    .setAuthor('CallRecordingBot')
                                    .setDescription('Call was not recorded on the s3 server');
                                message.channel.send({ embed });
                                return;
                            }
                        });
                    }, 60000);
                }
                else {
                    if (tribe.callRecording && !tribe.jitsiServer) {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('CallRecordingBot')
                            .setDescription(`You can't record call because you don't have a specified jitsi server for your tribe`);
                        message.channel.send({ embed });
                        return;
                    }
                    if (tribe.callRecording && !tribe.memeServerLocation) {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('CallRecordingBot')
                            .setDescription(`You can't record call because you don't have a specified s3 server where call recordings would be stored`);
                        message.channel.send({ embed });
                        return;
                    }
                    if (tribe.callRecording && !tribe.stakworkWebhook) {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('CallRecordingBot')
                            .setDescription(`You can't record call because you don't have a specified webhook where your processed call for your tribe would be sent too`);
                        message.channel.send({ embed });
                        return;
                    }
                    if (tribe.callRecording && !tribe.stakworkApiKey) {
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('CallRecordingBot')
                            .setDescription(`You can't record call because you don't have stakwork api key for your tribe`);
                        message.channel.send({ embed });
                        return;
                    }
                }
            }
        }
        catch (error) {
            logger_1.sphinxLogger.error(`CALL RECORDING BOT ERROR ${error}`, logger_1.logging.Bots);
        }
    }));
}
exports.init = init;
//# sourceMappingURL=callRecording.js.map