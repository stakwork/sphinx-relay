"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const case_1 = require("../utils/case");
const cronUtils = require("./cron");
function chatToJson(c) {
    const chat = c.dataValues || c;
    let contactIds = chat.contactIds || null;
    if (chat.contactIds && typeof chat.contactIds === 'string') {
        contactIds = JSON.parse(chat.contactIds);
    }
    return case_1.toSnake(Object.assign(Object.assign({}, chat), { contactIds }));
}
exports.chatToJson = chatToJson;
function messageToJson(msg, chat = null) {
    const message = msg.dataValues || msg;
    let statusMap = message.statusMap || null;
    if (message.statusMap && typeof message.statusMap === 'string') {
        statusMap = JSON.parse(message.statusMap);
    }
    return case_1.toSnake(Object.assign(Object.assign({}, message), { statusMap, chat: chat ? chatToJson(chat) : null }));
}
exports.messageToJson = messageToJson;
const contactToJson = (contact) => case_1.toSnake(contact.dataValues || contact);
exports.contactToJson = contactToJson;
const inviteToJson = (invite) => case_1.toSnake(invite.dataValues || invite);
exports.inviteToJson = inviteToJson;
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