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
exports.sendNotification = void 0;
const logger_1 = require("./utils/logger");
const models_1 = require("./models");
const node_fetch_1 = require("node-fetch");
const sequelize_1 = require("sequelize");
const constants_1 = require("./constants");
const sendNotification = (chat, name, type, owner, amount) => __awaiter(void 0, void 0, void 0, function* () {
    if (!owner)
        return console.log("=> sendNotification error: no owner");
    let message = `You have a new message from ${name}`;
    if (type === "invite") {
        message = `Your invite to ${name} is ready`;
    }
    if (type === "group_join") {
        message = `Someone joined ${name}`;
    }
    if (type === "group_leave") {
        message = `Someone left ${name}`;
    }
    if (type === "reject") {
        message = `The admin has declined your request to join "${name}"`;
    }
    if (type === "keysend") {
        message = `You have received a payment of ${amount} sats`;
    }
    // group
    if (type === "message" &&
        chat.type == constants_1.default.chat_types.group &&
        chat.name &&
        chat.name.length) {
        message += ` in ${chat.name}`;
    }
    // tribe
    if ((type === "message" || type === "boost") &&
        chat.type === constants_1.default.chat_types.tribe) {
        message = `You have a new ${type}`;
        if (chat.name && chat.name.length) {
            message += ` in ${chat.name}`;
        }
    }
    if (!owner.deviceId) {
        if (logger_1.logging.Notification)
            console.log("[send notification] skipping. owner.deviceId not set.");
        return;
    }
    const device_id = owner.deviceId;
    const isIOS = device_id.length === 64;
    const isAndroid = !isIOS;
    const params = { device_id };
    const notification = {
        chat_id: chat.id,
        sound: "",
    };
    if (type !== "badge" && !chat.isMuted) {
        notification.message = message;
        notification.sound = owner.notificationSound || "default";
    }
    else {
        if (isAndroid)
            return; // skip on Android if no actual message
    }
    params.notification = notification;
    const isTribeOwner = chat.ownerPubkey === owner.publicKey;
    if (type === "message" && chat.type == constants_1.default.chat_types.tribe) {
        debounce(() => {
            const count = tribeCounts[chat.id] ? tribeCounts[chat.id] + " " : "";
            params.notification.message = chat.isMuted
                ? ""
                : `You have ${count}new messages in ${chat.name}`;
            finalNotification(owner.id, params, isTribeOwner);
        }, chat.id, 30000);
    }
    else {
        finalNotification(owner.id, params, isTribeOwner);
    }
});
exports.sendNotification = sendNotification;
// const typesToNotNotify = [
//   constants.message_types.group_join,
//   constants.message_types.group_leave,
//   constants.message_types.boost,
// ];
function finalNotification(ownerID, params, isTribeOwner) {
    return __awaiter(this, void 0, void 0, function* () {
        if (params.notification.message) {
            if (logger_1.logging.Notification)
                console.log("[send notification]", params.notification);
        }
        const where = {
            sender: { [sequelize_1.Op.ne]: ownerID },
            seen: false,
            chatId: { [sequelize_1.Op.ne]: 0 },
            tenant: ownerID,
        };
        // if (!isTribeOwner) {
        //   where.type = { [Op.notIn]: typesToNotNotify };
        // }
        let unseenMessages = yield models_1.models.Message.count({
            where,
        });
        if (!unseenMessages)
            return;
        params.notification.badge = unseenMessages;
        triggerNotification(params);
    });
}
function triggerNotification(params) {
    node_fetch_1.default("https://hub.sphinx.chat/api/v1/nodes/notify", {
        method: "POST",
        body: JSON.stringify(params),
        headers: { "Content-Type": "application/json" },
    }).catch((error) => {
        console.log("[hub error]: triggerNotification", error);
    });
}
const bounceTimeouts = {};
const tribeCounts = {};
function debounce(func, id, delay) {
    const context = this;
    const args = arguments;
    if (bounceTimeouts[id])
        clearTimeout(bounceTimeouts[id]);
    if (!tribeCounts[id])
        tribeCounts[id] = 0;
    tribeCounts[id] += 1;
    bounceTimeouts[id] = setTimeout(() => {
        func.apply(context, args);
        // setTimeout(()=> tribeCounts[id]=0, 15)
        tribeCounts[id] = 0;
    }, delay);
}
//# sourceMappingURL=notify.js.map