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
const sequelize_1 = require("sequelize");
const hideAndUnhideCommand_1 = require("../controllers/botapi/hideAndUnhideCommand");
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
const botPrefix = '/callRecording';
function init() {
    if (initted)
        return;
    initted = true;
    const commands = ['history', 'update', 'retry', 'hide'];
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (((_a = message.author) === null || _a === void 0 ? void 0 : _a.bot) !== '/callRecording')
            return;
        try {
            const arr = (message.content && message.content.split(' ')) || [];
            const cmd = arr[1];
            const tribe = (yield models_1.models.Chat.findOne({
                where: { uuid: message.channel.id },
            }));
            if (arr[0] === '/call') {
                const isAdmin = message.member.roles.find((role) => role.name === 'Admin');
                if (!isAdmin)
                    return;
                switch (cmd) {
                    case 'history':
                        let limit = Number(arr[2]);
                        if (!limit || isNaN(limit)) {
                            limit = 10;
                        }
                        const calls = (yield models_1.models.CallRecording.findAll({
                            where: { chatId: tribe.id },
                            limit,
                            order: [['createdAt', 'DESC']],
                        }));
                        let returnMsg = '';
                        if (calls && calls.length > 0) {
                            calls.forEach((call) => {
                                returnMsg = `${returnMsg}${JSON.parse(call.createdBy).nickname} created ${call.recordingId}${Number(call.status) === 5
                                    ? ', recording was not successful'
                                    : ''} \n`;
                            });
                        }
                        else {
                            returnMsg = 'There is no call recording for this tribe';
                        }
                        const resEmbed = new Sphinx.MessageEmbed()
                            .setAuthor('CallRecordingBot')
                            .setDescription(returnMsg)
                            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                        message.channel.send({ embed: resEmbed });
                        return;
                    case 'update':
                        if (arr.length === 7) {
                            const callRecording = Number(arr[2]);
                            if (isNaN(callRecording) || callRecording > 1) {
                                const addFields = [
                                    {
                                        name: 'Call Recording Bot Error',
                                        value: 'Please provide a valid call recording option 1 or 0',
                                    },
                                ];
                                botResponse(addFields, 'CallRecordingBot', 'Call Recording Error', message, cmd, tribe.id);
                                return;
                            }
                            const jitsiServer = arr[3];
                            if (!jitsiServer) {
                                const addFields = [
                                    {
                                        name: 'Call Recording Bot Error',
                                        value: 'Provide a valid Jitsi Server url',
                                    },
                                ];
                                botResponse(addFields, 'CallRecordingBot', 'Call Recording Error', message, cmd, tribe.id);
                                return;
                            }
                            const memeServerLocation = arr[4];
                            if (!memeServerLocation) {
                                const addFields = [
                                    {
                                        name: 'Call Recording Bot Error',
                                        value: 'Provide a valid S3 Bucket url',
                                    },
                                ];
                                botResponse(addFields, 'CallRecordingBot', 'Call Recording Error', message, cmd, tribe.id);
                                return;
                            }
                            const stakworkApiKey = arr[5];
                            if (!stakworkApiKey) {
                                const addFields = [
                                    {
                                        name: 'Call Recording Bot Error',
                                        value: 'Provide a valid Stakwork API Key',
                                    },
                                ];
                                botResponse(addFields, 'CallRecordingBot', 'Call Recording Error', message, cmd, tribe.id);
                                return;
                            }
                            const stakworkWebhook = arr[6];
                            if (!stakworkWebhook) {
                                const addFields = [
                                    {
                                        name: 'Call Recording Bot Error',
                                        value: 'Provide a valid Webhook',
                                    },
                                ];
                                botResponse(addFields, 'CallRecordingBot', 'Call Recording Error', message, cmd, tribe.id);
                                return;
                            }
                            yield tribe.update({
                                callRecording,
                                jitsiServer,
                                memeServerLocation,
                                stakworkApiKey,
                                stakworkWebhook,
                            });
                            const embed = new Sphinx.MessageEmbed()
                                .setAuthor('CallRecordingBot')
                                .setDescription('Call Recording has been configured Successfully')
                                .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                            message.channel.send({ embed });
                            return;
                        }
                        else {
                            const resEmbed = new Sphinx.MessageEmbed()
                                .setAuthor('CallRecordingBot')
                                .setTitle('Call Recording Error:')
                                .addFields([
                                {
                                    name: 'Update tribe to configure call recording using the commands below',
                                    value: '/call update {CALL_RECORDIND 1 or 0} {JITSI_SERVER} {S3_BUCKET_URL} {STARKWORK_API_KEY} {WEBHOOK_URL}',
                                },
                            ])
                                .setThumbnail(botSVG)
                                .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                            message.channel.send({ embed: resEmbed });
                            return;
                        }
                    case 'retry':
                        const callRecordings = (yield models_1.models.CallRecording.findAll({
                            where: {
                                chatId: tribe.id,
                                status: { [sequelize_1.Op.not]: constants_1.default.call_status.stored },
                            },
                        }));
                        let botMessage = '';
                        for (let i = 0; i < callRecordings.length; i++) {
                            const callRecording = callRecordings[i];
                            let filename = callRecording.fileName;
                            if (tribe.memeServerLocation[tribe.memeServerLocation.length - 1] !== '/') {
                                filename = `/${filename}`;
                            }
                            let filePathAndName = `${tribe.memeServerLocation}${filename}`;
                            const file = yield (0, node_fetch_1.default)(filePathAndName, {
                                method: 'GET',
                                headers: { 'Content-Type': 'application/json' },
                            });
                            if (file.ok) {
                                const toStakwork = yield sendToStakwork(tribe.stakworkApiKey, callRecording.recordingId, filePathAndName, tribe.stakworkWebhook, tribe.ownerPubkey, callRecording.fileName, tribe.name);
                                if (toStakwork.ok) {
                                    const res = yield toStakwork.json();
                                    //update call record to stored
                                    callRecording.update({
                                        status: constants_1.default.call_status.stored,
                                        stakworkProjectId: res.data.project_id,
                                    });
                                    botMessage = `${botMessage} ${callRecording.fileName} Call was recorded successfully\n`;
                                }
                                else {
                                    callRecording.update({
                                        status: constants_1.default.call_status.in_actve,
                                    });
                                    botMessage = `${botMessage} ${callRecording.fileName} Call was not stored\n`;
                                }
                            }
                            else {
                                botMessage = `${botMessage} ${callRecording.fileName} call was not found\n`;
                            }
                        }
                        const newEmbed = new Sphinx.MessageEmbed()
                            .setAuthor('CallRecordingBot')
                            .setDescription(botMessage)
                            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                        message.channel.send({ embed: newEmbed });
                        return;
                    case 'hide':
                        yield (0, hideAndUnhideCommand_1.hideCommandHandler)(arr[2], commands, tribe.id, message, 'CallRecordingBot', '/callRecording');
                        return;
                    default:
                        const embed = new Sphinx.MessageEmbed()
                            .setAuthor('CallRecordingBot')
                            .setTitle('Bot Commands:')
                            .addFields([
                            {
                                name: 'Get Call History',
                                value: '/call history',
                            },
                            {
                                name: 'Retry a call',
                                value: '/call retry',
                            },
                        ])
                            .setThumbnail(botSVG)
                            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                        message.channel.send({ embed });
                        return;
                }
            }
            else {
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
                        let filename = `${updatedCallId}.mp4`;
                        if (tribe.memeServerLocation[tribe.memeServerLocation.length - 1] !==
                            '/') {
                            filename = `/${filename}`;
                        }
                        const callRecord = (yield models_1.models.CallRecording.create({
                            recordingId: updatedCallId,
                            chatId: tribe.id,
                            fileName: `${updatedCallId}.mp4`,
                            createdBy: JSON.stringify(message.member),
                            status: constants_1.default.call_status.new,
                        }));
                        let timeActive = 0;
                        const interval = setInterval(function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                timeActive += 60000;
                                const filePathAndName = `${tribe.memeServerLocation}${filename}`;
                                const file = yield (0, node_fetch_1.default)(filePathAndName, {
                                    method: 'GET',
                                    headers: { 'Content-Type': 'application/json' },
                                });
                                // If recording is found
                                if (file.ok) {
                                    // Push to stakwork
                                    // Audio tagging job
                                    const sendFile = yield sendToStakwork(tribe.stakworkApiKey, updatedCallId, filePathAndName, tribe.stakworkWebhook, tribe.ownerPubkey, filename, tribe.name);
                                    if (sendFile.ok) {
                                        const res = yield sendFile.json();
                                        //update call record to stored
                                        callRecord.update({
                                            status: constants_1.default.call_status.stored,
                                            stakworkProjectId: res.data.project_id,
                                        });
                                        clearInterval(interval);
                                        const embed = new Sphinx.MessageEmbed()
                                            .setAuthor('CallRecordingBot')
                                            .setDescription('Call was recorded successfully')
                                            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribe.id));
                                        message.channel.send({ embed });
                                        return;
                                    }
                                    else {
                                        throw `Could not store in stakwork Transcription response: ${sendFile.status}`;
                                    }
                                }
                                // If recording not found after specified time then it returns an error
                                if (timeActive === 10800000 && !file.ok) {
                                    clearInterval(interval);
                                    callRecord.update({ status: constants_1.default.call_status.in_actve });
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
        }
        catch (error) {
            logger_1.sphinxLogger.error(`CALL RECORDING BOT ERROR ${error}`, logger_1.logging.Bots);
        }
    }));
}
exports.init = init;
const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`;
function botResponse(addFields, author, title, message, cmd, tribeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const resEmbed = new Sphinx.MessageEmbed()
            .setAuthor(author)
            .setTitle(title)
            .addFields(addFields)
            .setThumbnail(botSVG)
            .setOnlyOwner(yield (0, hideAndUnhideCommand_1.determineOwnerOnly)(botPrefix, cmd, tribeId));
        message.channel.send({ embed: resEmbed });
    });
}
function sendToStakwork(apikey, callId, filePathAndName, webhook, ownerPubkey, filename, tribeName) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateInUTC = new Date(Date.now()).toUTCString();
        const dateInUnix = new Date(Date.now()).getTime() / 1000;
        return yield (0, node_fetch_1.default)(`https://jobs.stakwork.com/api/v1/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token token="${apikey}"`,
            },
            body: JSON.stringify({
                name: `${callId} file`,
                workflow_id: 5579,
                workflow_params: {
                    set_var: {
                        attributes: {
                            vars: {
                                media_url: filePathAndName,
                                episode_title: `Jitsi Call on ${dateInUTC}`,
                                clip_description: 'My Clip Description',
                                publish_date: `${dateInUnix}`,
                                episode_image: 'https://stakwork-uploads.s3.amazonaws.com/knowledge-graph-joe/jitsi.png',
                                show_img_url: 'https://stakwork-uploads.s3.amazonaws.com/knowledge-graph-joe/sphinx-logo.png',
                                webhook_url: `${webhook}`,
                                pubkey: ownerPubkey,
                                unique_id: filename.slice(0, -4),
                                clip_length: 60,
                                show_title: `${tribeName}`,
                            },
                        },
                    },
                },
            }),
        });
    });
}
//# sourceMappingURL=callRecording.js.map