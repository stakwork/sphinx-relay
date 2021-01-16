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
exports.payInviteInvoice = exports.payInviteInHub = exports.finishInviteInHub = exports.createInviteInHub = exports.sendNotification = exports.sendHubCall = exports.checkInvitesHubInterval = exports.pingHubInterval = exports.getAppVersionsFromHub = exports.sendInvoice = void 0;
const models_1 = require("./models");
const node_fetch_1 = require("node-fetch");
const sequelize_1 = require("sequelize");
const socket = require("./utils/socket");
const jsonUtils = require("./utils/json");
const helpers = require("./helpers");
const nodeinfo_1 = require("./utils/nodeinfo");
const lightning_1 = require("./utils/lightning");
const constants_1 = require("./constants");
const config_1 = require("./utils/config");
const https = require("https");
const pingAgent = new https.Agent({
    keepAlive: true
});
const checkInvitesAgent = new https.Agent({
    keepAlive: true
});
const env = process.env.NODE_ENV || 'development';
const config = config_1.loadConfig();
const checkInviteHub = (params = {}) => __awaiter(void 0, void 0, void 0, function* () {
    if (env != "production") {
        return;
    }
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    //console.log('[hub] checking invites ping')
    const inviteStrings = yield models_1.models.Invite.findAll({ where: { status: { [sequelize_1.Op.notIn]: [constants_1.default.invite_statuses.complete, constants_1.default.invite_statuses.expired] } } }).map(invite => invite.inviteString);
    if (inviteStrings.length === 0) {
        return; // skip if no invites
    }
    node_fetch_1.default(config.hub_api_url + '/invites/check', {
        agent: checkInvitesAgent,
        method: 'POST',
        body: JSON.stringify({ invite_strings: inviteStrings }),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(json => {
        if (json.object) {
            json.object.invites.map((object) => __awaiter(void 0, void 0, void 0, function* () {
                const invite = object.invite;
                const pubkey = object.pubkey;
                const price = object.price;
                const dbInvite = yield models_1.models.Invite.findOne({ where: { inviteString: invite.pin } });
                const contact = yield models_1.models.Contact.findOne({ where: { id: dbInvite.contactId } });
                if (dbInvite.status != invite.invite_status) {
                    const updateObj = { status: invite.invite_status, price: price };
                    if (invite.invoice)
                        updateObj.invoice = invite.invoice;
                    dbInvite.update(updateObj);
                    socket.sendJson({
                        type: 'invite',
                        response: jsonUtils.inviteToJson(dbInvite)
                    });
                    if (dbInvite.status == constants_1.default.invite_statuses.ready && contact) {
                        sendNotification(-1, contact.alias, 'invite');
                    }
                }
                if (pubkey && dbInvite.status == constants_1.default.invite_statuses.complete && contact) {
                    contact.update({ publicKey: pubkey, status: constants_1.default.contact_statuses.confirmed });
                    var contactJson = jsonUtils.contactToJson(contact);
                    contactJson.invite = jsonUtils.inviteToJson(dbInvite);
                    socket.sendJson({
                        type: 'contact',
                        response: contactJson
                    });
                    helpers.sendContactKeys({
                        contactIds: [contact.id],
                        sender: owner,
                        type: constants_1.default.message_types.contact_key,
                    });
                }
            }));
        }
    })
        .catch(error => {
        console.log('[hub error]', error);
    });
});
const pingHub = (params = {}) => __awaiter(void 0, void 0, void 0, function* () {
    if (env != "production") {
        return;
    }
    const node = yield nodeinfo_1.nodeinfo();
    sendHubCall(Object.assign(Object.assign({}, params), { node }));
});
function sendHubCall(params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield node_fetch_1.default(config.hub_api_url + '/ping', {
                agent: pingAgent,
                method: 'POST',
                body: JSON.stringify(params),
                headers: { 'Content-Type': 'application/json' }
            });
            const j = yield r.json();
            if (!(j && j.status && j.status === 'ok')) {
                console.log('[hub] ping returned not ok');
            }
        }
        catch (e) {
            console.log('[hub warning]: cannot reach hub', e);
        }
    });
}
exports.sendHubCall = sendHubCall;
const pingHubInterval = (ms) => {
    setInterval(pingHub, ms);
};
exports.pingHubInterval = pingHubInterval;
const checkInvitesHubInterval = (ms) => {
    setInterval(checkInviteHub, ms);
};
exports.checkInvitesHubInterval = checkInvitesHubInterval;
function sendInvoice(payReq, amount) {
    console.log('[hub] sending invoice');
    node_fetch_1.default(config.hub_api_url + '/invoices', {
        method: 'POST',
        body: JSON.stringify({ invoice: payReq, amount }),
        headers: { 'Content-Type': 'application/json' }
    })
        .catch(error => {
        console.log('[hub error]: sendInvoice', error);
    });
}
exports.sendInvoice = sendInvoice;
const finishInviteInHub = (params, onSuccess, onFailure) => {
    node_fetch_1.default(config.hub_api_url + '/invites/finish', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(json => {
        console.log('[hub] finished invite to hub');
        onSuccess(json);
    })
        .catch(e => {
        console.log('[hub] fail to finish invite in hub');
        onFailure(e);
    });
};
exports.finishInviteInHub = finishInviteInHub;
const payInviteInHub = (invite_string, params, onSuccess, onFailure) => {
    node_fetch_1.default(config.hub_api_url + '/invites/' + invite_string + '/pay', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(json => {
        if (json.object) {
            console.log('[hub] finished pay to hub');
            onSuccess(json);
        }
        else {
            console.log('[hub] fail to pay invite in hub');
            onFailure(json);
        }
    });
};
exports.payInviteInHub = payInviteInHub;
function payInviteInvoice(invoice, onSuccess, onFailure) {
    return __awaiter(this, void 0, void 0, function* () {
        const lightning = yield lightning_1.loadLightning();
        var call = lightning.sendPayment({});
        call.on('data', (response) => __awaiter(this, void 0, void 0, function* () {
            onSuccess(response);
        }));
        call.on('error', (err) => __awaiter(this, void 0, void 0, function* () {
            onFailure(err);
        }));
        call.write({ payment_request: invoice });
    });
}
exports.payInviteInvoice = payInviteInvoice;
const createInviteInHub = (params, onSuccess, onFailure) => {
    node_fetch_1.default(config.hub_api_url + '/invites_new', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(json => {
        if (json.object) {
            console.log('[hub] sent invite to be created to hub');
            onSuccess(json);
        }
        else {
            console.log('[hub] fail to create invite in hub');
            onFailure(json);
        }
    });
};
exports.createInviteInHub = createInviteInHub;
function getAppVersionsFromHub() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield node_fetch_1.default(config.hub_api_url + '/app_versions', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const j = yield r.json();
            return j;
        }
        catch (e) {
            return null;
        }
    });
}
exports.getAppVersionsFromHub = getAppVersionsFromHub;
const sendNotification = (chat, name, type, amount) => __awaiter(void 0, void 0, void 0, function* () {
    let message = `You have a new message from ${name}`;
    if (type === 'invite') {
        message = `Your invite to ${name} is ready`;
    }
    if (type === 'group') {
        message = `You have been added to group ${name}`;
    }
    if (type === 'reject') {
        message = `The admin has declined your request to join "${name}"`;
    }
    if (type === 'keysend') {
        message = `You have received a payment of ${amount} sats`;
    }
    // group
    if (type === 'message' && chat.type == constants_1.default.chat_types.group && chat.name && chat.name.length) {
        message += ` in ${chat.name}`;
    }
    // tribe
    if ((type === 'message' || type === 'boost') && chat.type === constants_1.default.chat_types.tribe) {
        message = `You have a new ${type}`;
        if (chat.name && chat.name.length) {
            message += ` in ${chat.name}`;
        }
    }
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    if (!owner.deviceId) {
        console.log('[send notification] skipping. owner.deviceId not set.');
        return;
    }
    const device_id = owner.deviceId;
    const isIOS = device_id.length === 64;
    const isAndroid = !isIOS;
    const params = { device_id };
    const notification = {
        chat_id: chat.id,
        sound: ''
    };
    if (type !== 'badge' && !chat.isMuted) {
        notification.message = message;
        notification.sound = owner.notificationSound || 'default';
    }
    else {
        if (isAndroid)
            return; // skip on Android if no actual message
    }
    params.notification = notification;
    if (type === 'message' && chat.type == constants_1.default.chat_types.tribe) {
        debounce(() => {
            const count = tribeCounts[chat.id] ? tribeCounts[chat.id] + ' ' : '';
            params.notification.message = chat.isMuted ? '' : `You have ${count}new messages in ${chat.name}`;
            finalNotification(owner.id, params);
        }, chat.id, 30000);
    }
    else {
        finalNotification(owner.id, params);
    }
});
exports.sendNotification = sendNotification;
function finalNotification(ownerID, params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (params.notification.message) {
            console.log('[send notification]', params.notification);
        }
        let unseenMessages = yield models_1.models.Message.count({
            where: {
                sender: { [sequelize_1.Op.ne]: ownerID },
                seen: false,
                chatId: { [sequelize_1.Op.ne]: 0 } // no anon keysends
            }
        });
        params.notification.badge = unseenMessages;
        triggerNotification(params);
    });
}
function triggerNotification(params) {
    node_fetch_1.default("https://hub.sphinx.chat/api/v1/nodes/notify", {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' }
    })
        .catch(error => {
        console.log('[hub error]: triggerNotification', error);
    });
}
// let inDebounce
// function debounce(func, delay) {
//   const context = this
//   const args = arguments
//   clearTimeout(inDebounce)
//   inDebounce = setTimeout(() => func.apply(context, args), delay)
// }
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
//# sourceMappingURL=hub.js.map