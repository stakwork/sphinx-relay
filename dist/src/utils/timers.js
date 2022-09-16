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
exports.payBack = exports.reloadTimers = exports.setTimer = exports.addTimer = exports.removeTimersByContactIdChatId = exports.removeTimersByContactId = exports.removeTimerByMsgId = void 0;
const models_1 = require("../models");
const network = require("../network");
const constants_1 = require("../constants");
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
function removeTimersByContactId(contactId, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const ts = yield models_1.models.Timer.findAll({
            where: { receiver: contactId, tenant },
        });
        ts.forEach((t) => clearTimer(t));
        models_1.models.Timer.destroy({ where: { receiver: contactId, tenant } });
    });
}
exports.removeTimersByContactId = removeTimersByContactId;
function removeTimersByContactIdChatId(contactId, chatId, tenant) {
    return __awaiter(this, void 0, void 0, function* () {
        const ts = yield models_1.models.Timer.findAll({
            where: { receiver: contactId, chatId, tenant },
        });
        ts.forEach((t) => clearTimer(t));
        models_1.models.Timer.destroy({ where: { receiver: contactId, chatId, tenant } });
    });
}
exports.removeTimersByContactIdChatId = removeTimersByContactIdChatId;
function addTimer({ amount, millis, receiver, msgId, chatId, tenant, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date().valueOf();
        const when = now + millis;
        const t = (yield models_1.models.Timer.create({
            amount,
            millis: when,
            receiver,
            msgId,
            chatId,
            tenant,
        }));
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
        const timers = (yield models_1.models.Timer.findAll());
        timers &&
            timers.forEach((t, i) => {
                const name = makeName(t);
                setTimer(name, t.millis, () => __awaiter(this, void 0, void 0, function* () {
                    setTimeout(() => {
                        payBack(t);
                    }, i * 999); // dont do all at once
                }));
            });
    });
}
exports.reloadTimers = reloadTimers;
function payBack(t) {
    return __awaiter(this, void 0, void 0, function* () {
        const chat = (yield models_1.models.Chat.findOne({
            where: { id: t.chatId, tenant: t.tenant },
        }));
        const owner = (yield models_1.models.Contact.findOne({
            where: { id: t.tenant },
        }));
        if (!chat) {
            models_1.models.Timer.destroy({ where: { id: t.id } });
            return;
        }
        const theChat = Object.assign(Object.assign({}, chat.dataValues), { contactIds: JSON.stringify([t.receiver]) });
        network.sendMessage({
            chat: theChat,
            sender: owner,
            message: { id: t.msgId, amount: t.amount },
            amount: t.amount,
            type: constants_1.default.message_types.repayment,
            realSatsContactId: t.receiver,
            success: function () {
                const date = new Date();
                date.setMilliseconds(0);
                models_1.models.Message.create({
                    // chatId: chat.id,
                    type: constants_1.default.message_types.repayment,
                    sender: t.tenant,
                    receiver: t.receiver,
                    date: date,
                    amount: t.amount,
                    createdAt: date,
                    updatedAt: date,
                    status: constants_1.default.statuses.received,
                    network_type: constants_1.default.network_types.lightning,
                    tenant: t.tenant,
                });
            },
        });
        models_1.models.Timer.destroy({ where: { id: t.id } });
    });
}
exports.payBack = payBack;
//# sourceMappingURL=timers.js.map