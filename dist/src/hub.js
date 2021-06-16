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
exports.resetNotifyTribeCount = exports.payInviteInvoice = exports.payInviteInHub = exports.finishInviteInHub = exports.createInviteInHub = exports.sendNotification = exports.sendHubCall = exports.checkInvitesHubInterval = exports.pingHubInterval = exports.getAppVersionsFromHub = exports.sendInvoice = void 0;
const models_1 = require("./models");
const node_fetch_1 = require("node-fetch");
const sequelize_1 = require("sequelize");
const socket = require("./utils/socket");
const jsonUtils = require("./utils/json");
const helpers = require("./helpers");
const nodeinfo_1 = require("./utils/nodeinfo");
const LND = require("./grpc/lightning");
const constants_1 = require("./constants");
const config_1 = require("./utils/config");
const https = require("https");
const proxy_1 = require("./utils/proxy");
const notify_1 = require("./notify");
Object.defineProperty(exports, "sendNotification", { enumerable: true, get: function () { return notify_1.sendNotification; } });
Object.defineProperty(exports, "resetNotifyTribeCount", { enumerable: true, get: function () { return notify_1.resetNotifyTribeCount; } });
const pingAgent = new https.Agent({
    keepAlive: true,
});
const checkInvitesAgent = new https.Agent({
    keepAlive: true,
});
const env = process.env.NODE_ENV || "development";
const config = config_1.loadConfig();
const checkInviteHub = (params = {}) => __awaiter(void 0, void 0, void 0, function* () {
    if (env != "production") {
        return;
    }
    //console.log('[hub] checking invites ping')
    const inviteStrings = yield models_1.models.Invite.findAll({
        where: {
            status: {
                [sequelize_1.Op.notIn]: [
                    constants_1.default.invite_statuses.complete,
                    constants_1.default.invite_statuses.expired,
                ],
            },
        },
    }).map((invite) => invite.inviteString);
    if (inviteStrings.length === 0) {
        return; // skip if no invites
    }
    node_fetch_1.default(config.hub_api_url + "/invites/check", {
        agent: checkInvitesAgent,
        method: "POST",
        body: JSON.stringify({ invite_strings: inviteStrings }),
        headers: { "Content-Type": "application/json" },
    })
        .then((res) => res.json())
        .then((json) => {
        if (json.object) {
            json.object.invites.map((object) => __awaiter(void 0, void 0, void 0, function* () {
                const invite = object.invite;
                const pubkey = object.pubkey;
                const routeHint = object.route_hint;
                const price = object.price;
                const dbInvite = yield models_1.models.Invite.findOne({
                    where: { inviteString: invite.pin },
                });
                const contact = yield models_1.models.Contact.findOne({
                    where: { id: dbInvite.contactId },
                });
                const owner = yield models_1.models.Contact.findOne({
                    where: { id: dbInvite.tenant },
                });
                if (dbInvite.status != invite.invite_status) {
                    const updateObj = {
                        status: invite.invite_status,
                        price: price,
                    };
                    if (invite.invoice)
                        updateObj.invoice = invite.invoice;
                    dbInvite.update(updateObj);
                    socket.sendJson({
                        type: "invite",
                        response: jsonUtils.inviteToJson(dbInvite),
                    }, owner.id);
                    if (dbInvite.status == constants_1.default.invite_statuses.ready && contact) {
                        notify_1.sendNotification(-1, contact.alias, "invite", owner);
                    }
                }
                if (pubkey &&
                    dbInvite.status == constants_1.default.invite_statuses.complete &&
                    contact) {
                    const updateObj = {
                        publicKey: pubkey,
                        status: constants_1.default.contact_statuses.confirmed,
                    };
                    if (routeHint)
                        updateObj.routeHint = routeHint;
                    contact.update(updateObj);
                    var contactJson = jsonUtils.contactToJson(contact);
                    contactJson.invite = jsonUtils.inviteToJson(dbInvite);
                    socket.sendJson({
                        type: "contact",
                        response: contactJson,
                    }, owner.id);
                    helpers.sendContactKeys({
                        contactIds: [contact.id],
                        sender: owner,
                        type: constants_1.default.message_types.contact_key,
                    });
                }
            }));
        }
    })
        .catch((error) => {
        console.log("[hub error]", error);
    });
});
const pingHub = (params = {}) => __awaiter(void 0, void 0, void 0, function* () {
    if (env != "production" || config.dont_ping_hub === 'true') {
        return;
    }
    const node = yield nodeinfo_1.nodeinfo();
    sendHubCall(Object.assign(Object.assign({}, params), { node }));
    if (proxy_1.isProxy()) {
        // send all "clean" nodes
        massPingHubFromProxies(node);
    }
});
function massPingHubFromProxies(rn) {
    return __awaiter(this, void 0, void 0, function* () {
        // real node
        const owners = yield models_1.models.Contact.findAll({
            where: {
                isOwner: true,
                id: { [sequelize_1.Op.ne]: 1 },
            },
        });
        const nodes = [];
        yield asyncForEach(owners, (o) => __awaiter(this, void 0, void 0, function* () {
            const proxyNodeInfo = yield nodeinfo_1.proxynodeinfo(o.publicKey);
            const clean = o.authToken === null || o.authToken === "";
            nodes.push(Object.assign(Object.assign({}, proxyNodeInfo), { clean, last_active: o.lastActive, route_hint: o.routeHint, relay_commit: rn.relay_commit, lnd_version: rn.lnd_version, relay_version: rn.relay_version, testnet: rn.testnet, ip: rn.ip, public_ip: rn.public_ip, node_alias: rn.node_alias }));
        }));
        sendHubCall({ nodes }, true);
    });
}
function sendHubCall(body, mass) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // console.log("=> PING BODY", body)
            const r = yield node_fetch_1.default(config.hub_api_url + (mass ? "/mass_ping" : "/ping"), {
                agent: pingAgent,
                method: "POST",
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
            });
            const j = yield r.json();
            // console.log("=> PING RESPONSE", j)
            if (!(j && j.status && j.status === "ok")) {
                console.log("[hub] ping returned not ok", j);
            }
        }
        catch (e) {
            console.log("[hub warning]: cannot reach hub", e);
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
    console.log("[hub] sending invoice");
    node_fetch_1.default(config.hub_api_url + "/invoices", {
        method: "POST",
        body: JSON.stringify({ invoice: payReq, amount }),
        headers: { "Content-Type": "application/json" },
    }).catch((error) => {
        console.log("[hub error]: sendInvoice", error);
    });
}
exports.sendInvoice = sendInvoice;
const finishInviteInHub = (params, onSuccess, onFailure) => {
    node_fetch_1.default(config.hub_api_url + "/invites/finish", {
        method: "POST",
        body: JSON.stringify(params),
        headers: { "Content-Type": "application/json" },
    })
        .then((res) => res.json())
        .then((json) => {
        console.log("[hub] finished invite to hub");
        onSuccess(json);
    })
        .catch((e) => {
        console.log("[hub] fail to finish invite in hub");
        onFailure(e);
    });
};
exports.finishInviteInHub = finishInviteInHub;
const payInviteInHub = (invite_string, params, onSuccess, onFailure) => {
    node_fetch_1.default(config.hub_api_url + "/invites/" + invite_string + "/pay", {
        method: "POST",
        body: JSON.stringify(params),
        headers: { "Content-Type": "application/json" },
    })
        .then((res) => res.json())
        .then((json) => {
        if (json.object) {
            console.log("[hub] finished pay to hub");
            onSuccess(json);
        }
        else {
            console.log("[hub] fail to pay invite in hub");
            onFailure(json);
        }
    });
};
exports.payInviteInHub = payInviteInHub;
function payInviteInvoice(invoice, pubkey, onSuccess, onFailure) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = LND.sendPayment(invoice, pubkey);
            onSuccess(res);
        }
        catch (e) {
            onFailure(e);
        }
    });
}
exports.payInviteInvoice = payInviteInvoice;
const createInviteInHub = (params, onSuccess, onFailure) => {
    node_fetch_1.default(config.hub_api_url + "/invites_new", {
        method: "POST",
        body: JSON.stringify(params),
        headers: { "Content-Type": "application/json" },
    })
        .then((res) => res.json())
        .then((json) => {
        if (json.object) {
            console.log("[hub] sent invite to be created to hub");
            onSuccess(json);
        }
        else {
            console.log("[hub] fail to create invite in hub");
            onFailure(json);
        }
    });
};
exports.createInviteInHub = createInviteInHub;
function getAppVersionsFromHub() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield node_fetch_1.default(config.hub_api_url + "/app_versions", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
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
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=hub.js.map