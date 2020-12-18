"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    return case_1.toSnake(Object.assign(Object.assign({}, chat), { contactIds }));
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
    return case_1.toSnake(Object.assign(Object.assign({}, message), { amount: message.amount ? parseInt(message.amount) : 0, amountMsat: message.amountMsat ? parseInt(message.amountMsat) : 0, statusMap, chat: chat ? chatToJson(chat) : null, contact: contact ? contactToJson(contact) : null }));
}
exports.messageToJson = messageToJson;
function contactToJson(contact) {
    if (!contact)
        return {};
    return case_1.toSnake(contact.dataValues || contact);
}
exports.contactToJson = contactToJson;
const inviteToJson = (invite) => case_1.toSnake(invite.dataValues || invite);
exports.inviteToJson = inviteToJson;
const botToJson = (bot) => case_1.toSnake(bot.dataValues || bot);
exports.botToJson = botToJson;
const accountingToJson = (acc) => case_1.toSnake(acc.dataValues || acc);
exports.accountingToJson = accountingToJson;
const jsonToContact = (json) => case_1.toCamel(json);
exports.jsonToContact = jsonToContact;
function subscriptionToJson(subscription, chat) {
    const sub = subscription.dataValues || subscription;
    const { interval, next } = cronUtils.parse(sub.cron);
    return case_1.toSnake(Object.assign(Object.assign({}, sub), { interval,
        next, chat: chat ? chatToJson(chat) : null }));
}
exports.subscriptionToJson = subscriptionToJson;
//# sourceMappingURL=json.js.map