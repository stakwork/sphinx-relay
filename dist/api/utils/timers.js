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
function addTimer({ amount, millis, receiver }) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date().valueOf();
        const when = now + millis;
        const t = yield models_1.models.Timer.create({
            amount, millis: when, receiver,
        });
        setTimer(when, () => __awaiter(this, void 0, void 0, function* () {
            payBack(t);
        }));
    });
}
exports.addTimer = addTimer;
function setTimer(when, cb) {
    const now = new Date().valueOf();
    const ms = when - now;
    if (ms < 0)
        cb(); // fire right away if its already passed
    else
        setTimeout(cb, ms);
}
exports.setTimer = setTimer;
function reloadTimers() {
    return __awaiter(this, void 0, void 0, function* () {
        const timers = yield models_1.models.Timer.findAll();
        timers && timers.forEach(t => {
            setTimer(t.millis, () => __awaiter(this, void 0, void 0, function* () {
                payBack(t);
            }));
        });
    });
}
exports.reloadTimers = reloadTimers;
function payBack(t) {
    return __awaiter(this, void 0, void 0, function* () {
        const contact = yield models_1.models.Contact.findOne({ where: { id: t.receiver } });
        if (contact) {
            network.signAndSend({
                amt: t.amount,
                dest: contact.publicKey,
            });
        }
        models_1.models.Timer.destroy({ where: { id: t.id } });
    });
}
exports.payBack = payBack;
//# sourceMappingURL=timers.js.map