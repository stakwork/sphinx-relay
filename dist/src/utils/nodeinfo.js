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
exports.isClean = exports.nodeinfo = exports.proxynodeinfo = exports.NodeType = void 0;
const Lightning = require("../grpc/lightning");
const publicIp = require("public-ip");
const gitinfo_1 = require("./gitinfo");
const models_1 = require("../models");
const config_1 = require("./config");
const logger_1 = require("./logger");
const config = (0, config_1.loadConfig)();
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT';
var NodeType;
(function (NodeType) {
    NodeType["NODE_PUBLIC"] = "node_public";
    NodeType["NODE_VIRTUAL"] = "node_virtual";
    NodeType["NODE_GREENLIGHT"] = "node_greenlight";
})(NodeType = exports.NodeType || (exports.NodeType = {}));
function proxynodeinfo(pk) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelList = yield Lightning.listChannels({});
        if (!channelList)
            throw new Error('cant get channels');
        const { channels } = channelList;
        const localBalances = channels.map((c) => parseInt(c.local_balance));
        const remoteBalances = channels.map((c) => parseInt(c.remote_balance));
        const largestLocalBalance = Math.max(...localBalances);
        const largestRemoteBalance = Math.max(...remoteBalances);
        const totalLocalBalance = localBalances.reduce((a, b) => a + b, 0);
        return {
            pubkey: pk,
            number_channels: channels.length,
            open_channel_data: channels,
            largest_local_balance: largestLocalBalance,
            largest_remote_balance: largestRemoteBalance,
            total_local_balance: totalLocalBalance,
            // node_type: 'node_virtual'
            node_type: NodeType.NODE_VIRTUAL,
        };
    });
}
exports.proxynodeinfo = proxynodeinfo;
function nodeinfo() {
    return __awaiter(this, void 0, void 0, function* () {
        const nzp = yield listNonZeroPolicies();
        let owner_pubkey;
        let info;
        try {
            const tryProxy = false;
            info = yield Lightning.getInfo(tryProxy);
            if (info.identity_pubkey)
                owner_pubkey = info.identity_pubkey;
        }
        catch (e) {
            // no LND
            let owner;
            try {
                owner = yield models_1.models.Contact.findOne({ where: { id: 1 } });
            }
            catch (e) {
                return; // just skip in SQLITE not open yet
            }
            if (!owner)
                return;
            let lastActive = owner.lastActive;
            if (!lastActive) {
                lastActive = new Date();
            }
            return {
                pubkey: owner.publicKey,
                wallet_locked: true,
                last_active: lastActive,
            };
        }
        let owner;
        try {
            owner = yield models_1.models.Contact.findOne({
                where: { isOwner: true, publicKey: owner_pubkey },
            });
        }
        catch (e) {
            return; // just skip in SQLITE not open yet
        }
        if (!owner)
            return;
        let lastActive = owner.lastActive;
        if (!lastActive) {
            lastActive = new Date();
        }
        let public_ip = '';
        try {
            public_ip = yield publicIp.v4();
        }
        catch (e) {
            //do nothing here
        }
        const commitHash = yield (0, gitinfo_1.checkCommitHash)();
        const tag = yield (0, gitinfo_1.checkTag)();
        const clean = yield isClean();
        const latest_message = yield latestMessage();
        try {
            const channelList = yield Lightning.listChannels({});
            if (!channelList)
                return;
            const { channels } = channelList;
            const localBalances = channels.map((c) => parseInt(c.local_balance));
            const remoteBalances = channels.map((c) => parseInt(c.remote_balance));
            const largestLocalBalance = Math.max(...localBalances);
            const largestRemoteBalance = Math.max(...remoteBalances);
            const totalLocalBalance = localBalances.reduce((a, b) => a + b, 0);
            const pendingChannels = yield Lightning.pendingChannels();
            if (!info)
                return;
            const node = {
                node_alias: process.env.NODE_ALIAS || '',
                ip: process.env.NODE_IP || '',
                lnd_port: process.env.NODE_LND_PORT || '',
                relay_commit: commitHash || '',
                public_ip: public_ip,
                pubkey: owner.publicKey,
                route_hint: owner.routeHint,
                number_channels: channels.length,
                number_active_channels: info.num_active_channels,
                number_pending_channels: info.num_pending_channels,
                number_peers: info.num_peers,
                largest_local_balance: largestLocalBalance,
                largest_remote_balance: largestRemoteBalance,
                total_local_balance: totalLocalBalance,
                lnd_version: info.version,
                relay_version: tag || '',
                payment_channel: '',
                hosting_provider: '',
                open_channel_data: channels,
                pending_channel_data: pendingChannels,
                synced_to_chain: info.synced_to_chain,
                synced_to_graph: info.synced_to_graph,
                best_header_timestamp: info.best_header_timestamp,
                testnet: info.testnet,
                clean,
                latest_message,
                last_active: lastActive,
                wallet_locked: false,
                non_zero_policies: nzp,
                node_type: IS_GREENLIGHT
                    ? NodeType.NODE_GREENLIGHT
                    : NodeType.NODE_PUBLIC,
            };
            return node;
        }
        catch (e) {
            logger_1.sphinxLogger.error(`=> ${e}`);
        }
    });
}
exports.nodeinfo = nodeinfo;
function isClean() {
    return __awaiter(this, void 0, void 0, function* () {
        // has owner but with no auth token (id=1?)
        const cleanOwner = yield models_1.models.Contact.findOne({
            where: { id: 1, isOwner: true, authToken: null },
        });
        const msgs = yield models_1.models.Message.count();
        const allContacts = yield models_1.models.Contact.count();
        const noMsgs = msgs === 0;
        const onlyOneContact = allContacts === 1;
        if (cleanOwner && noMsgs && onlyOneContact)
            return true;
        return false;
    });
}
exports.isClean = isClean;
function latestMessage() {
    return __awaiter(this, void 0, void 0, function* () {
        const lasts = yield models_1.models.Message.findAll({
            limit: 1,
            order: [['createdAt', 'DESC']],
        });
        const last = lasts && lasts[0];
        if (last) {
            return last.createdAt;
        }
        else {
            return '';
        }
    });
}
const policies = ['node1_policy', 'node2_policy'];
function listNonZeroPolicies() {
    return __awaiter(this, void 0, void 0, function* () {
        const ret = [];
        try {
            const channelList = yield Lightning.listChannels({});
            if (!channelList)
                return ret;
            if (!channelList.channels)
                return ret;
            const { channels } = channelList;
            yield asyncForEach(channels, (chan) => __awaiter(this, void 0, void 0, function* () {
                const tryProxy = false;
                const info = yield Lightning.getChanInfo(chan.chan_id, tryProxy);
                if (!info)
                    return;
                policies.forEach((p) => {
                    if (info[p]) {
                        const fee_base_msat = parseInt(info[p].fee_base_msat);
                        const disabled = info[p].disabled;
                        if (fee_base_msat > 0 || disabled) {
                            ret.push({
                                node: p,
                                fee_base_msat,
                                chan_id: chan.chan_id,
                                disabled,
                            });
                        }
                    }
                });
            }));
        }
        catch (e) {
            return ret;
        }
        return ret;
    });
}
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=nodeinfo.js.map