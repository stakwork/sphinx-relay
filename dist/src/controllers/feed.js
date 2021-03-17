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
exports.anonymousKeysend = exports.streamFeed = void 0;
const models_1 = require("../models");
const helpers = require("../helpers");
const res_1 = require("../utils/res");
const constants_1 = require("../constants");
const streamFeed = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, "no owner");
    const tenant = req.owner.id;
    const { destinations, amount, chat_id, text, update_meta, } = req.body;
    if (!(destinations && destinations.length)) {
        return res_1.failure(res, "no destinations");
    }
    if (update_meta) {
        let meta;
        try {
            meta = JSON.parse(text);
        }
        catch (e) { }
        if (!meta) {
            return res_1.failure(res, "no meta");
        }
        if (meta && meta.itemID) {
            const cm = {
                itemID: meta.itemID,
                ts: meta.ts || 0,
                sats_per_minute: amount || 0,
                speed: meta.speed || "1",
            };
            const chat = yield models_1.models.Chat.findOne({
                where: { id: chat_id, tenant },
            });
            if (!chat) {
                return res_1.failure(res, "no chat");
            }
            yield chat.update({ meta: JSON.stringify(cm) });
        }
    }
    const owner = req.owner;
    if (amount && typeof amount === "number") {
        yield asyncForEach(destinations, (d) => __awaiter(void 0, void 0, void 0, function* () {
            if (d.type === "node") {
                if (!d.address)
                    return;
                if (d.address.length !== 66)
                    return;
                if (d.address === owner.publicKey)
                    return; // dont send to self
                const amt = Math.max(Math.round((d.split / 100) * amount), 1);
                yield anonymousKeysend(owner, d.address, d.routeHint, amt, text, function () { }, function () { });
            }
        }));
    }
    res_1.success(res, {});
});
exports.streamFeed = streamFeed;
function anonymousKeysend(owner, destination_key, route_hint, amount, text, onSuccess, onFailure) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = owner.id;
        const msg = {
            type: constants_1.default.message_types.keysend,
        };
        if (text)
            msg.message = { content: text };
        return helpers.performKeysendMessage({
            sender: owner,
            destination_key,
            route_hint,
            amount,
            msg,
            success: () => {
                console.log("payment sent!");
                var date = new Date();
                date.setMilliseconds(0);
                models_1.models.Message.create({
                    chatId: 0,
                    type: constants_1.default.message_types.keysend,
                    sender: 1,
                    amount,
                    amountMsat: amount * 1000,
                    paymentHash: "",
                    date,
                    messageContent: text || "",
                    status: constants_1.default.statuses.confirmed,
                    createdAt: date,
                    updatedAt: date,
                    tenant,
                });
                onSuccess({ destination_key, amount });
            },
            failure: (error) => {
                onFailure(error);
            },
        });
    });
}
exports.anonymousKeysend = anonymousKeysend;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=feed.js.map