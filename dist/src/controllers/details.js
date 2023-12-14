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
exports.updateChannelPolicy = exports.clearForTesting = exports.getNodeInfo = exports.getLocalRemoteBalance = exports.getBalance = exports.getChannels = exports.getLightningInfo = exports.getLogsSince = exports.checkRouteByContactOrChat = exports.checkRoute = exports.getAppVersions = exports.getRelayVersion = void 0;
const readLastLines = require("read-last-lines");
const sequelize_1 = require("sequelize");
const Lightning = require("../grpc/lightning");
const res_1 = require("../utils/res");
const nodeinfo_1 = require("../utils/nodeinfo");
const constants_1 = require("../constants");
const models_1 = require("../models");
const config_1 = require("../utils/config");
const hub_1 = require("../hub");
const logger_1 = require("../utils/logger");
const config = (0, config_1.loadConfig)();
const VERSION = 2;
function getRelayVersion(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, res_1.success)(res, { version: VERSION });
    });
}
exports.getRelayVersion = getRelayVersion;
function getAppVersions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const vs = yield (0, hub_1.getAppVersionsFromHub)();
        if (vs) {
            (0, res_1.success)(res, vs);
        }
        else {
            (0, res_1.failure)(res, 'Could not load app versions');
        }
    });
}
exports.getAppVersions = getAppVersions;
const checkRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const { pubkey, amount, route_hint } = req.query;
    if (!(pubkey && pubkey.length === 66))
        return (0, res_1.failure)(res, 'wrong pubkey');
    const owner = req.owner;
    try {
        const amt = parseInt(amount) || constants_1.default.min_sat_amount;
        const r = yield Lightning.queryRoute(pubkey, amt, route_hint || '', owner.publicKey);
        (0, res_1.success)(res, r);
    }
    catch (e) {
        (0, res_1.failure)(res, e);
    }
});
exports.checkRoute = checkRoute;
const checkRouteByContactOrChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const chatID = req.query.chat_id;
    const contactID = req.query.contact_id;
    if (!chatID && !contactID)
        return (0, res_1.failure)(res, 'no chat_id or contact_id');
    let pubkey = '';
    let routeHint = '';
    if (contactID) {
        const contactId = parseInt(contactID);
        const contact = (yield models_1.models.Contact.findOne({
            where: { id: contactId },
        }));
        if (!contact)
            return (0, res_1.failure)(res, 'cant find contact');
        pubkey = contact.publicKey;
        routeHint = contact.routeHint;
    }
    else if (chatID) {
        const chatId = parseInt(chatID);
        const chat = (yield models_1.models.Chat.findOne({
            where: { id: chatId },
        }));
        if (!chat)
            return (0, res_1.failure)(res, 'cant find chat');
        if (!chat.ownerPubkey)
            return (0, res_1.failure)(res, 'cant find owern_pubkey');
        pubkey = chat.ownerPubkey;
        const chatowner = (yield models_1.models.Contact.findOne({
            where: { publicKey: chat.ownerPubkey },
        }));
        if (!chatowner)
            return (0, res_1.failure)(res, 'cant find chat owner');
        if (chatowner.routeHint)
            routeHint = chatowner.routeHint;
    }
    if (!(pubkey && pubkey.length === 66))
        return (0, res_1.failure)(res, 'wrong pubkey');
    const amount = req.query.amount;
    const owner = req.owner;
    try {
        const amt = parseInt(amount) || constants_1.default.min_sat_amount;
        const r = yield Lightning.queryRoute(pubkey, amt, routeHint || '', owner.publicKey);
        (0, res_1.success)(res, r);
    }
    catch (e) {
        (0, res_1.failure)(res, e);
    }
});
exports.checkRouteByContactOrChat = checkRouteByContactOrChat;
const defaultLogFiles = [
    '/var/log/supervisor/relay.log',
    '/home/lnd/.pm2/logs/app-error.log',
    '/var/log/syslog',
];
function getLogsSince(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const logFiles = config.log_file ? [config.log_file] : defaultLogFiles;
        let txt;
        let err;
        yield asyncForEach(logFiles, (filepath) => __awaiter(this, void 0, void 0, function* () {
            if (!txt) {
                try {
                    const lines = yield readLastLines.read(filepath, 500);
                    if (lines) {
                        const linesArray = lines.split('\n');
                        linesArray.reverse();
                        txt = linesArray.join('\n');
                    }
                }
                catch (e) {
                    err = e;
                }
            }
        }));
        if (txt)
            (0, res_1.success)(res, txt);
        else
            (0, res_1.failure)(res, err);
    });
}
exports.getLogsSince = getLogsSince;
const getLightningInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    res.status(200);
    try {
        const response = yield Lightning.getInfo();
        res.json({ success: true, response });
    }
    catch (e) {
        res.json({ success: false });
    }
    res.end();
});
exports.getLightningInfo = getLightningInfo;
const getChannels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    res.status(200);
    try {
        const response = yield Lightning.listChannels({});
        res.json({ success: true, response });
    }
    catch (err) {
        res.json({ success: false });
    }
    res.end();
});
exports.getChannels = getChannels;
const getBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const date = new Date();
    date.setMilliseconds(0);
    const owner = (yield models_1.models.Contact.findOne({
        where: { id: tenant },
    }));
    owner.update({ lastActive: date });
    res.status(200);
    try {
        const blcs = yield Lightning.complexBalances(owner.publicKey);
        res.json({
            success: true,
            response: blcs,
        });
    }
    catch (e) {
        logger_1.sphinxLogger.error(`ERROR getBalance ${e}`);
        res.json({ success: false });
    }
    res.end();
});
exports.getBalance = getBalance;
const getLocalRemoteBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    res.status(200);
    try {
        const channelList = yield Lightning.listChannels({}, req.owner.publicKey);
        const { channels } = channelList;
        const localBalances = channels.map((c) => parseInt(c.local_balance));
        const remoteBalances = channels.map((c) => parseInt(c.remote_balance));
        const totalLocalBalance = localBalances.reduce((a, b) => a + b, 0);
        const totalRemoteBalance = remoteBalances.reduce((a, b) => a + b, 0);
        res.json({
            success: true,
            response: {
                local_balance: totalLocalBalance,
                remote_balance: totalRemoteBalance,
            },
        });
    }
    catch (err) {
        res.json({ success: false });
    }
    res.end();
});
exports.getLocalRemoteBalance = getLocalRemoteBalance;
const getNodeInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ipOfSource = req.connection.remoteAddress;
    if (!(ipOfSource.includes('127.0.0.1') || ipOfSource.includes('localhost'))) {
        res.status(401);
        res.end();
        return;
    }
    const node = yield (0, nodeinfo_1.nodeinfo)();
    res.status(200);
    res.json(node);
    res.end();
});
exports.getNodeInfo = getNodeInfo;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
function clearForTesting(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        if (!tenant)
            return (0, res_1.failure)(res, 'no tenant');
        try {
            yield models_1.models.Chat.destroy({ where: { tenant } });
            yield models_1.models.Subscription.destroy({ where: { tenant } });
            yield models_1.models.Bot.destroy({ where: { tenant } });
            yield models_1.models.BotMember.destroy({ where: { tenant } });
            yield models_1.models.ChatBot.destroy({ where: { tenant } });
            yield models_1.models.Invite.destroy({ where: { tenant } });
            yield models_1.models.MediaKey.destroy({ where: { tenant } });
            yield models_1.models.Message.destroy({ where: { tenant } });
            yield models_1.models.Timer.destroy({ where: { tenant } });
            yield models_1.models.Contact.destroy({
                where: {
                    isOwner: { [sequelize_1.Op.or]: [false, null] },
                    tenant,
                },
            });
            const me = (yield models_1.models.Contact.findOne({
                where: { isOwner: true, tenant },
            }));
            yield me.update({
                authToken: '',
                photoUrl: '',
                contactKey: '',
                alias: '',
                deviceId: '',
            });
            (0, res_1.success)(res, { clean: true });
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.clearForTesting = clearForTesting;
const updateChannelPolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    try {
        const { base_fee } = req.body;
        yield Lightning.updateChannelPolicies(base_fee);
        return (0, res_1.success)(res, 'updated successfully');
    }
    catch (error) {
        return (0, res_1.failure)(res, error);
    }
});
exports.updateChannelPolicy = updateChannelPolicy;
//# sourceMappingURL=details.js.map