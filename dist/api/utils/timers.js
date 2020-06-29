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
const models_1 = require("../models");
const network = require("../network");
const path = require("path");
const constants = require(path.join(__dirname, '../../config/constants.json'));
const timerz = {};
function clearTimer(t) {
    const name = makeName(t);
    if (name)
        clearTimeout(timerz[name]);
}
function removeTimerByMsgId(msgId) {
    return __awaiter(this, void 0, void 0, function* () {
        const t = yield models_1.models.Timer.findOne({ where: { msgId } });
        clearTimer(t);
        models_1.models.Timer.destroy({ where: { msgId } });
    });
}
exports.removeTimerByMsgId = removeTimerByMsgId;
function removeTimersByContactId(contactId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ts = yield models_1.models.Timer.findAll({ where: { receiver: contactId } });
        ts.forEach(t => clearTimer(t));
        models_1.models.Timer.destroy({ where: { receiver: contactId } });
    });
}
exports.removeTimersByContactId = removeTimersByContactId;
function addTimer({ amount, millis, receiver, msgId, chatId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date().valueOf();
        const when = now + millis;
        const t = yield models_1.models.Timer.create({
            amount, millis: when, receiver, msgId, chatId,
        });
        setTimer(makeName(t), when, () => __awaiter(this, void 0, void 0, function* () {
            payBack(t);
        }));
    });
}
exports.addTimer = addTimer;
function setTimer(name, when, cb) {
    const now = new Date().valueOf();
    const ms = when - now;
    if (ms < 0) {
        cb(); // fire right away if its already passed
    }
    else {
        timerz[name] = setTimeout(cb, ms);
    }
}
exports.setTimer = setTimer;
function makeName(t) {
    if (!t)
        return '';
    return `${t.chatId}_${t.receiver}_${t.msgId}`;
}
function reloadTimers() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("reload timers");
        const timers = yield models_1.models.Timer.findAll();
        console.log('timers.length', timers.length);
        timers && timers.forEach((t, i) => {
            const name = makeName(t);
            setTimer(name, t.millis, () => __awaiter(this, void 0, void 0, function* () {
                setTimeout(() => {
                    payBack(t);
                }, i * 250); // dont do all at once
            }));
        });
    });
}
exports.reloadTimers = reloadTimers;
function payBack(t) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('pay back');
        const chat = yield models_1.models.Chat.findOne({ where: { id: t.chatId } });
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        console.log('is a chat?', chat.id);
        if (!chat)
            return;
        const theChat = Object.assign(Object.assign({}, chat.dataValues), { contactIds: [t.receiver] });
        console.log('send msg', { id: t.msgId });
        network.sendMessage({
            chat: theChat,
            sender: owner,
            message: { id: t.msgId },
            amount: t.amount,
            type: constants.message_types.direct_payment,
        });
        models_1.models.Timer.destroy({ where: { id: t.id } });
    });
}
exports.payBack = payBack;
//# sourceMappingURL=timers.js.map