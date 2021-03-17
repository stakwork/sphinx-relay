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
exports.editSubscription = exports.createSubscription = exports.getSubscriptionsForContact = exports.deleteSubscription = exports.getSubscription = exports.getAllSubscriptions = exports.restartSubscription = exports.pauseSubscription = exports.initializeCronJobs = void 0;
const models_1 = require("../models");
const res_1 = require("../utils/res");
const cron_1 = require("cron");
const case_1 = require("../utils/case");
const cronUtils = require("../utils/cron");
const socket = require("../utils/socket");
const jsonUtils = require("../utils/json");
const helpers = require("../helpers");
const rsa = require("../crypto/rsa");
const moment = require("moment");
const network = require("../network");
const constants_1 = require("../constants");
// store all current running jobs in memory
let jobs = {};
// init jobs from DB
const initializeCronJobs = () => __awaiter(void 0, void 0, void 0, function* () {
    yield helpers.sleep(1000);
    const subs = yield getRawSubs({ where: { ended: false } });
    subs.length &&
        subs.forEach((sub) => {
            console.log("=> starting subscription cron job", sub.id + ":", sub.cron);
            startCronJob(sub);
        });
});
exports.initializeCronJobs = initializeCronJobs;
function startCronJob(sub) {
    return __awaiter(this, void 0, void 0, function* () {
        jobs[sub.id] = new cron_1.CronJob(sub.cron, function () {
            return __awaiter(this, void 0, void 0, function* () {
                const subscription = yield models_1.models.Subscription.findOne({
                    where: { id: sub.id },
                });
                if (!subscription) {
                    delete jobs[sub.id];
                    return this.stop();
                }
                console.log("EXEC CRON =>", subscription.id);
                if (subscription.paused) {
                    // skip, still in jobs{} tho
                    return this.stop();
                }
                let STOP = checkSubscriptionShouldAlreadyHaveEnded(subscription);
                if (STOP) {
                    // end the job and return
                    console.log("stop");
                    subscription.update({ ended: true });
                    delete jobs[subscription.id];
                    return this.stop();
                }
                const tenant = subscription.tenant;
                const owner = yield models_1.models.Contact.findOne({ where: { id: tenant } });
                // SEND PAYMENT!!!
                sendSubscriptionPayment(subscription, false, owner);
            });
        }, null, true);
    });
}
function checkSubscriptionShouldAlreadyHaveEnded(sub) {
    if (sub.endDate) {
        const now = new Date();
        if (now.getTime() > sub.endDate.getTime()) {
            return true;
        }
    }
    if (sub.endNumber) {
        if (sub.count >= sub.endNumber) {
            return true;
        }
    }
    return false;
}
function checkSubscriptionShouldEndAfterThisPayment(sub) {
    if (sub.endDate) {
        const { ms } = cronUtils.parse(sub.cron);
        const now = new Date();
        if (now.getTime() + ms > sub.endDate.getTime()) {
            return true;
        }
    }
    if (sub.endNumber) {
        if (sub.count + 1 >= sub.endNumber) {
            return true;
        }
    }
    return false;
}
function msgForSubPayment(owner, sub, isFirstMessage, forMe) {
    let text = "";
    if (isFirstMessage) {
        const alias = forMe ? "You" : owner.alias;
        text = `${alias} subscribed\n`;
    }
    else {
        text = "Subscription\n";
    }
    text += `Amount: ${sub.amount} sats\n`;
    text += `Interval: ${cronUtils.parse(sub.cron).interval}\n`;
    if (sub.endDate) {
        text += `End: ${moment(sub.endDate).format("MM/DD/YY")}\n`;
        text += `Status: ${sub.count + 1} sent`;
    }
    else if (sub.endNumber) {
        text += `Status: ${sub.count + 1} of ${sub.endNumber} sent`;
    }
    return text;
}
function sendSubscriptionPayment(sub, isFirstMessage, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = owner.id;
        var date = new Date();
        date.setMilliseconds(0);
        const subscription = yield models_1.models.Subscription.findOne({
            where: { id: sub.id, tenant },
        });
        if (!subscription) {
            return;
        }
        const chat = yield models_1.models.Chat.findOne({
            where: { id: subscription.chatId, tenant },
        });
        if (!subscription) {
            console.log("=> no sub for this payment!!!");
            return;
        }
        const forMe = false;
        const text = msgForSubPayment(owner, sub, isFirstMessage, forMe);
        const contact = yield models_1.models.Contact.findByPk(sub.contactId);
        const enc = rsa.encrypt(contact.contactKey, text);
        network.sendMessage({
            chat: chat,
            sender: owner,
            type: constants_1.default.message_types.direct_payment,
            message: { amount: sub.amount, content: enc },
            amount: sub.amount,
            success: (data) => __awaiter(this, void 0, void 0, function* () {
                const shouldEnd = checkSubscriptionShouldEndAfterThisPayment(subscription);
                const obj = {
                    totalPaid: parseFloat(subscription.totalPaid || 0) +
                        parseFloat(subscription.amount),
                    count: parseInt(subscription.count || 0) + 1,
                    ended: false,
                };
                if (shouldEnd) {
                    obj.ended = true;
                    if (jobs[sub.id])
                        jobs[subscription.id].stop();
                    delete jobs[subscription.id];
                }
                yield subscription.update(obj);
                const forMe = true;
                const text2 = msgForSubPayment(owner, sub, isFirstMessage, forMe);
                const encText = rsa.encrypt(owner.contactKey, text2);
                const message = yield models_1.models.Message.create({
                    chatId: chat.id,
                    sender: owner.id,
                    type: constants_1.default.message_types.direct_payment,
                    status: constants_1.default.statuses.confirmed,
                    messageContent: encText,
                    amount: subscription.amount,
                    amountMsat: parseFloat(subscription.amount) * 1000,
                    date: date,
                    createdAt: date,
                    updatedAt: date,
                    subscriptionId: subscription.id,
                    tenant,
                });
                socket.sendJson({
                    type: "direct_payment",
                    response: jsonUtils.messageToJson(message, chat),
                }, tenant);
            }),
            failure: (err) => __awaiter(this, void 0, void 0, function* () {
                console.log("SEND PAY ERROR");
                let errMessage = constants_1.default.payment_errors[err] || "Unknown";
                errMessage = "Payment Failed: " + errMessage;
                const message = yield models_1.models.Message.create({
                    chatId: chat.id,
                    sender: owner.id,
                    type: constants_1.default.message_types.direct_payment,
                    status: constants_1.default.statuses.failed,
                    messageContent: errMessage,
                    amount: sub.amount,
                    amountMsat: parseFloat(sub.amount) * 1000,
                    date: date,
                    createdAt: date,
                    updatedAt: date,
                    subscriptionId: sub.id,
                    tenant,
                });
                socket.sendJson({
                    type: "direct_payment",
                    response: jsonUtils.messageToJson(message, chat),
                }, tenant);
            }),
        });
    });
}
// pause sub
function pauseSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        const tenant = req.owner.id;
        const id = parseInt(req.params.id);
        try {
            const sub = yield models_1.models.Subscription.findOne({ where: { id, tenant } });
            if (sub) {
                sub.update({ paused: true });
                if (jobs[id])
                    jobs[id].stop();
                res_1.success(res, jsonUtils.subscriptionToJson(sub, null));
            }
            else {
                res_1.failure(res, "not found");
            }
        }
        catch (e) {
            console.log("ERROR pauseSubscription", e);
            res_1.failure(res, e);
        }
    });
}
exports.pauseSubscription = pauseSubscription;
// restart sub
function restartSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        const tenant = req.owner.id;
        const id = parseInt(req.params.id);
        try {
            const sub = yield models_1.models.Subscription.findOne({ where: { id, tenant } });
            if (sub) {
                sub.update({ paused: false });
                if (jobs[id])
                    jobs[id].start();
                res_1.success(res, jsonUtils.subscriptionToJson(sub, null));
            }
            else {
                res_1.failure(res, "not found");
            }
        }
        catch (e) {
            console.log("ERROR restartSubscription", e);
            res_1.failure(res, e);
        }
    });
}
exports.restartSubscription = restartSubscription;
function getRawSubs(opts = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = Object.assign({ order: [["id", "asc"]] }, opts);
        try {
            const subs = yield models_1.models.Subscription.findAll(options);
            return subs;
        }
        catch (e) {
            throw e;
        }
    });
}
// all subs
const getAllSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, "no owner");
    const tenant = req.owner.id;
    try {
        const subs = yield getRawSubs({ where: { tenant } });
        res_1.success(res, subs.map((sub) => jsonUtils.subscriptionToJson(sub, null)));
    }
    catch (e) {
        console.log("ERROR getAllSubscriptions", e);
        res_1.failure(res, e);
    }
});
exports.getAllSubscriptions = getAllSubscriptions;
// one sub by id
function getSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        const tenant = req.owner.id;
        try {
            const sub = yield models_1.models.Subscription.findOne({
                where: { id: req.params.id, tenant },
            });
            res_1.success(res, jsonUtils.subscriptionToJson(sub, null));
        }
        catch (e) {
            console.log("ERROR getSubscription", e);
            res_1.failure(res, e);
        }
    });
}
exports.getSubscription = getSubscription;
// delete sub by id
function deleteSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        const tenant = req.owner.id;
        const id = req.params.id;
        if (!id)
            return;
        try {
            if (jobs[id]) {
                jobs[id].stop();
                delete jobs[id];
            }
            models_1.models.Subscription.destroy({ where: { id, tenant } });
            res_1.success(res, true);
        }
        catch (e) {
            console.log("ERROR deleteSubscription", e);
            res_1.failure(res, e);
        }
    });
}
exports.deleteSubscription = deleteSubscription;
// all subs for contact id
const getSubscriptionsForContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, "no owner");
    const tenant = req.owner.id;
    try {
        const subs = yield getRawSubs({
            where: { contactId: req.params.contactId, tenant },
        });
        res_1.success(res, subs.map((sub) => jsonUtils.subscriptionToJson(sub, null)));
    }
    catch (e) {
        console.log("ERROR getSubscriptionsForContact", e);
        res_1.failure(res, e);
    }
});
exports.getSubscriptionsForContact = getSubscriptionsForContact;
// create new sub
function createSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        const tenant = req.owner.id;
        const date = new Date();
        date.setMilliseconds(0);
        const s = jsonToSubscription(Object.assign(Object.assign({}, req.body), { count: 0, total_paid: 0, createdAt: date, ended: false, paused: false, tenant }));
        if (!s.cron) {
            return res_1.failure(res, "Invalid interval");
        }
        try {
            const owner = req.owner;
            const chat = yield helpers.findOrCreateChat({
                chat_id: req.body.chat_id,
                owner_id: owner.id,
                recipient_id: req.body.contact_id,
            });
            s.chatId = chat.id; // add chat id if newly created
            if (!owner || !chat) {
                return res_1.failure(res, "Invalid chat or contact");
            }
            const sub = yield models_1.models.Subscription.create(s);
            startCronJob(sub);
            const isFirstMessage = true;
            sendSubscriptionPayment(sub, isFirstMessage, owner);
            res_1.success(res, jsonUtils.subscriptionToJson(sub, chat));
        }
        catch (e) {
            console.log("ERROR createSubscription", e);
            res_1.failure(res, e);
        }
    });
}
exports.createSubscription = createSubscription;
function editSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, "no owner");
        const tenant = req.owner.id;
        console.log("=> editSubscription");
        const date = new Date();
        date.setMilliseconds(0);
        const id = parseInt(req.params.id);
        const s = jsonToSubscription(Object.assign(Object.assign({}, req.body), { count: 0, createdAt: date, ended: false, paused: false, tenant }));
        try {
            if (!id || !s.chatId || !s.cron) {
                return res_1.failure(res, "Invalid data");
            }
            const subRecord = yield models_1.models.Subscription.findOne({ where: { id } });
            if (!subRecord) {
                return res_1.failure(res, "No subscription found");
            }
            // stop so it can be restarted
            if (jobs[id])
                jobs[id].stop();
            const obj = {
                cron: s.cron,
                updatedAt: date,
            };
            if (s.amount)
                obj.amount = s.amount;
            if (s.endDate)
                obj.endDate = s.endDate;
            if (s.endNumber)
                obj.endNumber = s.endNumber;
            const sub = yield subRecord.update(obj);
            const end = checkSubscriptionShouldAlreadyHaveEnded(sub);
            if (end) {
                yield subRecord.update({ ended: true });
                delete jobs[id];
            }
            else {
                startCronJob(sub); // restart
            }
            const chat = yield models_1.models.Chat.findOne({ where: { id: s.chatId, tenant } });
            res_1.success(res, jsonUtils.subscriptionToJson(sub, chat));
        }
        catch (e) {
            console.log("ERROR createSubscription", e);
            res_1.failure(res, e);
        }
    });
}
exports.editSubscription = editSubscription;
function jsonToSubscription(j) {
    console.log("=>", j);
    const cron = cronUtils.make(j.interval);
    return case_1.toCamel(Object.assign(Object.assign({}, j), { cron }));
}
//# sourceMappingURL=subscriptions.js.map