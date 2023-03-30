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
exports.resetNotifyTribeCount = exports.sendNotification = exports.sendVoipNotification = void 0;
const logger_1 = require("./utils/logger");
const models_1 = require("./models");
const node_fetch_1 = require("node-fetch");
const sequelize_1 = require("sequelize");
const constants_1 = require("./constants");
const logger_2 = require("./utils/logger");
function sendVoipNotification(owner, notification) {
    const params = {
        device_id: owner.pushKitToken,
        type: 'incoming_call',
        notification,
    };
    triggerVoipNotification(params);
}
exports.sendVoipNotification = sendVoipNotification;
const sendNotification = (chat, name, type, owner, amount, push) => __awaiter(void 0, void 0, void 0, function* () {
    if (!owner)
        return logger_2.sphinxLogger.error(`=> sendNotification error: no owner`);
    let message = `You have a new message from ${name}`;
    if (type === 'invite') {
        message = `Your invite to ${name} is ready`;
    }
    if (type === 'group_join') {
        message = `Someone joined ${name}`;
    }
    if (type === 'group_leave') {
        message = `Someone left ${name}`;
    }
    if (type === 'reject') {
        message = `The admin has declined your request to join "${name}"`;
    }
    if (type === 'keysend') {
        message = `You have received a payment of ${amount} sats`;
    }
    // group
    if (type === 'message' &&
        chat.type == constants_1.default.chat_types.group &&
        chat.name &&
        chat.name.length) {
        message += ` in ${chat.name}`;
    }
    // tribe
    if ((type === 'message' || type === 'boost') &&
        chat.type === constants_1.default.chat_types.tribe) {
        message = `You have a new ${type}`;
        if (chat.name && chat.name.length) {
            message += ` in ${chat.name}`;
        }
    }
    if (!owner.deviceId) {
        if (logger_1.logging.Notification)
            logger_2.sphinxLogger.info(`[send notification] skipping. owner.deviceId not set.`);
        return;
    }
    const device_id = owner.deviceId;
    const isIOS = device_id.length === 64;
    const isAndroid = !isIOS;
    const params = { device_id, notification: {} };
    const notification = {
        chat_id: chat.id || 0,
        sound: '',
    };
    let chatIsMuted = chat.notify === constants_1.default.notify_levels.mute;
    if (chat.notify === constants_1.default.notify_levels.mentions && !push) {
        chatIsMuted = true;
    }
    if (type !== 'badge' && !chatIsMuted) {
        notification.message = message;
        notification.sound = owner.notificationSound || 'default';
    }
    else {
        if (isAndroid)
            return; // skip on Android if no actual message
    }
    params.notification = notification;
    // const isTribeOwner = chat.ownerPubkey === owner.publicKey
    if (type === 'message' && chat.type == constants_1.default.chat_types.tribe) {
        debounce(() => {
            const count = tribeCounts[chat.id] ? tribeCounts[chat.id] + ' ' : '';
            params.notification.message = chatIsMuted
                ? ''
                : `You have ${count}new messages in ${chat.name}`;
            finalNotification(owner.id, params);
        }, chat.id, 30000);
    }
    else if (chat.type == constants_1.default.chat_types.conversation) {
        try {
            const cids = JSON.parse(chat.contactIds || '[]');
            const notme = cids.find((id) => id !== 1);
            const other = (yield models_1.models.Contact.findOne({
                where: { id: notme },
            }));
            if (other.blocked)
                return;
            finalNotification(owner.id, params);
        }
        catch (e) {
            logger_2.sphinxLogger.error(`=> notify conversation err ${e}`);
        }
    }
    else {
        finalNotification(owner.id, params);
    }
});
exports.sendNotification = sendNotification;
// const typesToNotNotify = [
//   constants.message_types.group_join,
//   constants.message_types.group_leave,
//   constants.message_types.boost,
// ];
function finalNotification(ownerID, params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (params.notification.message) {
            if (logger_1.logging.Notification)
                logger_2.sphinxLogger.info(`[send notification] ${params.notification}`);
        }
        const unseen = yield countUnseen(ownerID);
        // if(!unseenMessages) return
        if (!unseen) {
            params.notification.message = '';
            params.notification.sound = '';
        }
        params.notification.badge = unseen;
        triggerNotification(params);
    });
}
function countUnseen(ownerID) {
    return __awaiter(this, void 0, void 0, function* () {
        const unmutedChats = (yield models_1.models.Chat.findAll({
            where: {
                tenant: ownerID,
                notify: constants_1.default.notify_levels.all,
            },
        }));
        const unmutedChatIds = (unmutedChats && unmutedChats.map((mc) => mc.id)) || [];
        const unseenMessages = yield models_1.models.Message.count({
            where: {
                sender: { [sequelize_1.Op.ne]: ownerID },
                seen: false,
                chatId: unmutedChatIds,
                tenant: ownerID,
            },
        });
        const mentionChats = (yield models_1.models.Chat.findAll({
            where: {
                tenant: ownerID,
                notify: constants_1.default.notify_levels.mentions,
            },
        }));
        const mentionChatIds = (mentionChats && mentionChats.map((mc) => mc.id)) || [];
        const unseenMentions = yield models_1.models.Message.count({
            where: {
                sender: { [sequelize_1.Op.ne]: ownerID },
                seen: false,
                push: true,
                chatId: mentionChatIds,
                tenant: ownerID,
            },
        });
        return unseenMessages + unseenMentions;
    });
}
function triggerNotification(params) {
    (0, node_fetch_1.default)('https://hub.sphinx.chat/api/v1/nodes/notify', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
    }).catch((error) => {
        logger_2.sphinxLogger.error(`[hub error]: triggerNotification ${error}`);
    });
}
function triggerVoipNotification(params) {
    (0, node_fetch_1.default)('https://hub.sphinx.chat/api/v1/nodes/notify', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
    }).catch((error) => {
        logger_2.sphinxLogger.error(`[hub error]: triggerVoipNotification ${error}`);
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
function resetNotifyTribeCount(chatID) {
    tribeCounts[chatID] = 0;
}
exports.resetNotifyTribeCount = resetNotifyTribeCount;
//# sourceMappingURL=notify.js.map