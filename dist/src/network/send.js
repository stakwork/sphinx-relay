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
exports.detectMentionsForTribeAdminSelf = exports.newmsg = exports.signAndSend = exports.sendMessage = void 0;
const models_1 = require("../models");
const LND = require("../grpc/lightning");
const helpers_1 = require("../helpers");
const msg_1 = require("../utils/msg");
const tribes = require("../utils/tribes");
const confirmations_1 = require("../controllers/confirmations");
const receive_1 = require("./receive");
const intercept = require("./intercept");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
const config_1 = require("../utils/config");
const config = (0, config_1.loadConfig)();
/**
 * Sends a message to a chat.
 *
 * @param {SendMessageParams} params - The parameters for sending the message.
 * @param {number} params.type - The type of the message to be sent.
 * @param {Partial<ChatPlusMembers>} params.chat - The chat object to which the message will be sent.
 * @param {Partial<MessageContent>} params.message - The message content to be sent.
 * @param {Partial<ContactRecord | Contact>} params.sender - The sender of the message.
 * @param {number} [params.amount] - The amount of the message to be sent, if applicable.
 * @param {(data: any) => void} [params.success] - The callback function to be executed upon successful message send.
 * @param {(error: any) => void} [params.failure] - The callback function to be executed upon failed message send.
 * @param {string} [params.skipPubKey] - The public key to be skipped in the message send process, if applicable.
 * @param {boolean} [params.isForwarded] - A flag indicating whether the message is being forwarded.
 * @param {number} [params.forwardedFromContactId] - The id of the contact from which the message is being forwarded, if applicable.
 * @param {number} [params.realSatsContactId] - The id of the contact for which the message is being sent in real sats, if applicable.
 * @returns {Promise<void>} A promise that resolves when the message send process is complete.
 */
function sendMessage({ type, chat, message, sender, amount, success, failure, skipPubKey, isForwarded, forwardedFromContactId, realSatsContactId, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!chat || !sender)
            return;
        const tenant = sender.id;
        if (!tenant)
            return;
        const isTribe = chat.type === constants_1.default.chat_types.tribe;
        const isTribeOwner = isTribe && sender.publicKey === chat.ownerPubkey;
        let aSender = sender;
        if (sender.dataValues) {
            aSender = sender.dataValues;
        }
        const theSender = aSender;
        // let theSender: ContactRecord = (sender.dataValues || sender) as ContactRecord
        if (isTribeOwner && !isForwarded) {
            theSender.role = constants_1.default.chat_roles.owner;
        }
        let msg = newmsg(type, chat, theSender, message, isForwarded ? true : false);
        if (!(sender && sender.publicKey)) {
            return;
        }
        let contactIds = (typeof chat.contactIds === 'string'
            ? JSON.parse(chat.contactIds)
            : chat.contactIds) || [];
        let justMe = false;
        if (contactIds.length === 1) {
            if (contactIds[0] === tenant) {
                // JUST ME!
                justMe = true;
            }
        }
        let networkType = undefined;
        const chatUUID = chat.uuid;
        let mentionContactIds = [];
        if (isTribe) {
            if (type === constants_1.default.message_types.confirmation) {
                // if u are owner, go ahead!
                if (!isTribeOwner)
                    return; // dont send confs for tribe if not owner
            }
            if (isTribeOwner) {
                networkType = 'mqtt'; // broadcast to all
                // decrypt message.content and message.mediaKey w groupKey
                msg = yield (0, msg_1.decryptMessage)(msg, chat);
                logger_1.sphinxLogger.info(`[Network] => isTribeAdmin msg sending... ${msg}`, logger_1.logging.Network);
                const isBotMsg = yield intercept.isBotMsg(msg, true, sender, forwardedFromContactId);
                if (isBotMsg === true) {
                    logger_1.sphinxLogger.info(`[Network] => isBotMsg`, logger_1.logging.Network);
                    // return // DO NOT FORWARD TO TRIBE, forwarded to bot instead?
                }
                if (msg.sender.role === constants_1.default.chat_roles.owner && msg.type === 0) {
                    try {
                        const newChat = (yield models_1.models.Chat.findOne({
                            where: { uuid: msg.chat.uuid },
                        }));
                        const bots = (yield models_1.models.ChatBot.findAll({
                            where: { tenant, chatId: newChat.id },
                        }));
                        const content = msg.message.content;
                        let splitedContent = content.split(' ');
                        console.log(splitedContent);
                        for (let i = 0; i < bots.length; i++) {
                            const bot = bots[i];
                            console.log(bot.dataValues);
                            if (bot.botPrefix === splitedContent[0] &&
                                bot.hiddenCommands &&
                                JSON.parse(bot.hiddenCommands).includes(splitedContent[1])) {
                                console.log(splitedContent);
                                justMe = true;
                            }
                        }
                    }
                    catch (error) {
                        logger_1.sphinxLogger.error('Failed to check if hidden command', logger_1.logging.Network);
                    }
                }
                mentionContactIds = yield detectMentions(msg, isForwarded ? true : false, chat.id, tenant);
            }
            // stop here if just me
            if (justMe) {
                if (success)
                    success(true);
                return; // if no contacts thats fine (like create public tribe)
            }
            if (isTribeOwner) {
                try {
                    // post last_active to tribes server
                    if (chat.uuid && chat.host) {
                        tribes.putActivity(chat.uuid, chat.host, sender.publicKey);
                    }
                }
                catch (e) {
                    logger_1.sphinxLogger.error('failed to tribes.putActivity', logger_1.logging.Network);
                }
            }
            else {
                // if tribe, send to owner only
                const tribeOwner = (yield models_1.models.Contact.findOne({
                    where: { publicKey: chat.ownerPubkey, tenant },
                }));
                contactIds = tribeOwner ? [tribeOwner.id] : [];
            }
        }
        else {
            // not a tribe
            if (justMe) {
                if (success)
                    success(true);
                return;
            }
        }
        let yes = true;
        let no = null;
        logger_1.sphinxLogger.info(`=> sending to ${contactIds.length} 'contacts'`, logger_1.logging.Network);
        yield (0, helpers_1.asyncForEach)(contactIds, (contactId) => __awaiter(this, void 0, void 0, function* () {
            if (contactId === tenant) {
                // dont send to self
                return;
            }
            const contact = (yield models_1.models.Contact.findOne({
                where: { id: contactId },
            }));
            if (!contact) {
                return; // skip if u simply dont have the contact
            }
            if (tenant === -1) {
                // this is a bot sent from me!
                if (contact.isOwner) {
                    return; // dont MQTT to myself!
                }
            }
            const destkey = contact.publicKey;
            if (destkey === skipPubKey) {
                return; // skip (for tribe owner broadcasting, not back to the sender)
            }
            let mqttTopic = networkType === 'mqtt' ? `${destkey}/${chatUUID}` : '';
            // sending a payment to one subscriber, buying a pic from OG poster
            // or boost to og poster
            if (isTribeOwner && amount && realSatsContactId === contactId) {
                mqttTopic = ''; // FORCE KEYSEND!!!
                yield (0, msg_1.recordLeadershipScore)(tenant, amount, chat.id, contactId, type);
            }
            const m = yield (0, msg_1.personalizeMessage)(msg, contact, isTribeOwner);
            // send a "push", the user was mentioned
            if (mentionContactIds.includes(contact.id) ||
                mentionContactIds.includes(Infinity)) {
                m.message.push = true;
            }
            const opts = {
                dest: destkey,
                data: m,
                amt: Math.max(amount || 0, constants_1.default.min_sat_amount),
                route_hint: contact.routeHint || '',
            };
            try {
                const r = yield signAndSend(opts, sender, mqttTopic);
                yes = r;
            }
            catch (e) {
                logger_1.sphinxLogger.error(`KEYSEND ERROR ${e}`);
                no = e;
            }
            yield (0, helpers_1.sleep)(10);
        }));
        if (no) {
            if (failure)
                failure(no);
        }
        else {
            if (success)
                success(yes);
        }
    });
}
exports.sendMessage = sendMessage;
/**
 * Signs and sends a message to a specified destination.
 *
 * @param {SignAndSendOpts} opts - The options for the message to be sent.
 * @param {Object} owner - The object containing the owner's public key and id.
 * @param {string} [mqttTopic] - The MQTT topic to be used for publishing the message.
 * @param {boolean} [replayingHistory] - A flag indicating whether the message is being replayed from history.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating the success or failure of the operation.
 */
function signAndSend(opts, owner, mqttTopic, replayingHistory) {
    const ownerPubkey = owner.publicKey;
    const ownerID = owner.id;
    return new Promise(function (resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!opts || typeof opts !== 'object') {
                return reject('object plz');
            }
            if (!opts.dest) {
                return reject('no dest pubkey');
            }
            let data = JSON.stringify(opts.data || {});
            opts.amt = opts.amt || 0;
            const sig = yield LND.signAscii(data, ownerPubkey);
            data = data + sig;
            try {
                /*This happens when a tribe owner wants to send to its members
                  This is because the tribe owner is acting as the gate to get
                  the message through to the rest of the members, but sending
                  to the other members in the chat should not cost sats      */
                if (mqttTopic) {
                    yield tribes.publish(mqttTopic, data, ownerPubkey, () => {
                        if (!replayingHistory) {
                            if (mqttTopic)
                                checkIfAutoConfirm(opts.data, ownerID);
                        }
                    });
                }
                else {
                    yield LND.keysendMessage(Object.assign(Object.assign({}, opts), { data }), ownerPubkey);
                }
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
exports.signAndSend = signAndSend;
/**
 * Checks if a message should be auto-confirmed and performs the auto-confirmation if necessary.
 *
 * @param {Object} data - The data of the message to be checked.
 * @param {number} tenant - The tenant of the message to be checked.
 */
function checkIfAutoConfirm(data, tenant) {
    if (receive_1.typesToForward.includes(data.type)) {
        if (data.type === constants_1.default.message_types.delete) {
            return; // dont auto confirm delete msg
        }
        (0, confirmations_1.tribeOwnerAutoConfirmation)(data.message.id, data.chat.uuid, tenant);
    }
}
/**
 * Creates a new message object.
 *
 * @param {number} type - The type of the message.
 * @param {Partial<ChatPlusMembers>} chat - The chat object of the message.
 * @param {ContactRecord} sender - The sender of the message.
 * @param {Partial<MessageContent>} message - The message content.
 * @param {boolean} isForwarded - A flag indicating whether the message is being forwarded.
 * @param {boolean} [includeStatus] - A flag indicating whether to include the status in the message object.
 * @returns {Msg} The new message object.
 */
function newmsg(type, chat, sender, message, isForwarded, includeStatus) {
    const includeGroupKey = type === constants_1.default.message_types.group_create ||
        type === constants_1.default.message_types.group_invite;
    const includeAlias = sender && sender.alias && chat.type === constants_1.default.chat_types.tribe;
    let aliasToInclude = sender.alias;
    if (!isForwarded && includeAlias && chat.myAlias) {
        aliasToInclude = chat.myAlias;
    }
    const includePhotoUrl = sender &&
        !sender.privatePhoto &&
        chat &&
        chat.type === constants_1.default.chat_types.tribe;
    let photoUrlToInclude = sender.photoUrl || '';
    if (!isForwarded && includePhotoUrl && chat.myPhotoUrl) {
        photoUrlToInclude = chat.myPhotoUrl;
    }
    if (!includeStatus && message.status) {
        delete message.status;
    }
    logger_1.sphinxLogger.info(`PERSONUUID in newmsg ${sender.personUuid}`, logger_1.logging.Network);
    const result = {
        type: type,
        chat: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ uuid: chat.uuid }, (chat.name && { name: chat.name })), ((chat.type || chat.type === 0) && { type: chat.type })), (chat.members && { members: chat.members })), (includeGroupKey && chat.groupKey && { groupKey: chat.groupKey })), (includeGroupKey && chat.host && { host: chat.host })),
        message: message,
        sender: Object.assign(Object.assign(Object.assign(Object.assign({ pub_key: sender.publicKey }, (sender.routeHint && { route_hint: sender.routeHint })), (sender.personUuid && {
            person: `${config.people_host}/${sender.personUuid}`,
        })), { alias: includeAlias ? aliasToInclude : '', role: sender.role || constants_1.default.chat_roles.reader }), (includePhotoUrl && { photo_url: photoUrlToInclude })),
    };
    return result;
}
exports.newmsg = newmsg;
/**
 * Detects mentions in a message and returns an array of contact IDs of the mentioned contacts.
 *
 * @param {Msg} msg - The message object.
 * @param {boolean} isForwarded - A flag indicating whether the message is being forwarded.
 * @param {number} chatId - The ID of the chat the message belongs to.
 * @param {number} tenant - The tenant of the message.
 * @returns {Promise<number[]>} An array of contact IDs of the mentioned contacts.
 */
function detectMentions(msg, isForwarded, chatId, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = msg.message.content;
        if (!content)
            return [];
        if (!content.includes('@'))
            return [];
        const mentions = parseMentions(content);
        if (mentions.includes('@all') && !isForwarded)
            return [Infinity];
        const ret = [];
        const allMembers = (yield models_1.models.ChatMember.findAll({
            where: { tenant, chatId },
        }));
        yield (0, helpers_1.asyncForEach)(mentions, (men) => __awaiter(this, void 0, void 0, function* () {
            const lastAlias = men.substring(1);
            // check chat memberss
            const member = allMembers.find((m) => {
                if (m.lastAlias && lastAlias) {
                    return compareAliases(m.lastAlias, lastAlias);
                }
            });
            if (member) {
                ret.push(member.contactId);
            }
        }));
        return ret;
    });
}
function parseMentions(content) {
    // split on space or newline
    const words = content.split(/\n| /);
    return words.filter((w) => w.startsWith('@'));
}
function detectMentionsForTribeAdminSelf(msg, mainAlias, aliasInChat) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = msg.message.content;
        if (!content)
            return false;
        const mentions = parseMentions(content);
        if (mentions.includes('@all'))
            return true;
        let ret = false;
        yield (0, helpers_1.asyncForEach)(mentions, (men) => __awaiter(this, void 0, void 0, function* () {
            const lastAlias = men.substring(1);
            if (lastAlias) {
                if (aliasInChat) {
                    // admin's own alias for tribe
                    if (compareAliases(aliasInChat, lastAlias)) {
                        ret = true;
                    }
                }
                else if (mainAlias) {
                    // or owner's default alias
                    if (compareAliases(mainAlias, lastAlias)) {
                        ret = true;
                    }
                }
            }
        }));
        return ret;
    });
}
exports.detectMentionsForTribeAdminSelf = detectMentionsForTribeAdminSelf;
// alias1 can have spaces, so remove them
// then comparse to lower case
function compareAliases(alias1, alias2) {
    const pieces = alias1.split(' ');
    let match = false;
    pieces.forEach((p) => {
        if (p && alias2) {
            if (p.toLowerCase() === alias2.toLowerCase()) {
                match = true;
            }
        }
    });
    return match;
}
//# sourceMappingURL=send.js.map