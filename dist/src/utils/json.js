"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountingToJson = exports.botToJson = exports.subscriptionToJson = exports.chatToJson = exports.jsonToContact = exports.inviteToJson = exports.contactToJson = exports.messageToJson = void 0;
const case_1 = require("../utils/case");
const cronUtils = require("./cron");
function chatToJson(c) {
    if (!c)
        return {};
    const ch = c.dataValues || c;
    const chat = JSON.parse(JSON.stringify(ch));
    let contactIds = chat.contactIds || null;
    if (chat.contactIds && typeof chat.contactIds === 'string') {
        contactIds = JSON.parse(chat.contactIds);
    }
    delete chat.groupPrivateKey;
    return (0, case_1.toSnake)(Object.assign(Object.assign({}, chat), { contactIds }));
}
exports.chatToJson = chatToJson;
function messageToJson(msg, chat, contact) {
    if (!msg)
        return {};
    const message = msg.dataValues || msg;
    let statusMap = message.statusMap || null;
    if (message.statusMap && typeof message.statusMap === 'string') {
        statusMap = JSON.parse(message.statusMap);
    }
    return (0, case_1.toSnake)(Object.assign(Object.assign({}, message), { 
        // type: message.type ? parseInt(message.type) : 0,
        amount: message.amount ? parseInt(message.amount) : 0, amountMsat: message.amountMsat ? parseInt(message.amountMsat) : 0, statusMap, chat: chat ? chatToJson(chat) : null, contact: contact ? contactToJson(contact) : null }));
}
exports.messageToJson = messageToJson;
function contactToJson(contact) {
    if (!contact)
        return {};
    const c = contact.dataValues || contact;
    if (c.authToken)
        delete c.authToken;
    if (c.adminToken)
        delete c.adminToken;
    return (0, case_1.toSnake)(c);
}
exports.contactToJson = contactToJson;
const inviteToJson = (invite) => (0, case_1.toSnake)(invite.dataValues || invite);
exports.inviteToJson = inviteToJson;
const botToJson = (bot) => (0, case_1.toSnake)(bot.dataValues || bot);
exports.botToJson = botToJson;
const accountingToJson = (acc) => (0, case_1.toSnake)(acc.dataValues || acc);
exports.accountingToJson = accountingToJson;
const jsonToContact = (json) => (0, case_1.toCamel)(json);
exports.jsonToContact = jsonToContact;
function subscriptionToJson(subscription, chat) {
    const sub = subscription.dataValues || subscription;
    const { interval, next } = cronUtils.parse(sub.cron);
    return (0, case_1.toSnake)(Object.assign(Object.assign({}, sub), { interval,
        next, chat: chat ? chatToJson(chat) : null }));
}
exports.subscriptionToJson = subscriptionToJson;
//# sourceMappingURL=json.js.map