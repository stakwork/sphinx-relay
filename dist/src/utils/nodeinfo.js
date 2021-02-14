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
exports.isClean = exports.nodeinfo = exports.proxynodeinfo = void 0;
const LND = require("../utils/lightning");
const publicIp = require("public-ip");
const gitinfo_1 = require("../utils/gitinfo");
const models_1 = require("../models");
function proxynodeinfo(pk) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const lightning = yield LND.loadLightning(true, pk); // dont try proxy
        lightning.listChannels({}, (err, channelList) => {
            if (err)
                console.log(err);
            if (!channelList)
                return;
            const { channels } = channelList;
            resolve({
                pubkey: pk,
                number_channels: channels.length,
                open_channel_data: channels,
                clean: true
            });
        });
    }));
}
exports.proxynodeinfo = proxynodeinfo;
function nodeinfo() {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const nzp = yield listNonZeroPolicies();
        let owner_pubkey;
        try {
            const tryProxy = false;
            const info = yield LND.getInfo(tryProxy);
            if (info.identity_pubkey)
                owner_pubkey = info.identity_pubkey;
        }
        catch (e) { // no LND
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
            const node = {
                pubkey: owner.publicKey,
                wallet_locked: true,
                last_active: lastActive
            };
            resolve(node);
            return;
        }
        let owner;
        try {
            owner = yield models_1.models.Contact.findOne({ where: { isOwner: true, publicKey: owner_pubkey } });
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
        let public_ip = "";
        try {
            public_ip = yield publicIp.v4();
        }
        catch (e) { }
        const commitHash = yield gitinfo_1.checkCommitHash();
        const tag = yield gitinfo_1.checkTag();
        const clean = yield isClean();
        const latest_message = yield latestMessage();
        const lightning = yield LND.loadLightning(false); // dont try proxy
        try {
            lightning.listChannels({}, (err, channelList) => {
                if (err)
                    console.log(err);
                if (!channelList)
                    return;
                const { channels } = channelList;
                const localBalances = channels.map(c => c.local_balance);
                const remoteBalances = channels.map(c => c.remote_balance);
                const largestLocalBalance = Math.max(...localBalances);
                const largestRemoteBalance = Math.max(...remoteBalances);
                const totalLocalBalance = localBalances.reduce((a, b) => parseInt(a) + parseInt(b), 0);
                lightning.pendingChannels({}, (err, pendingChannels) => {
                    if (err)
                        console.log(err);
                    lightning.getInfo({}, (err, info) => {
                        if (err)
                            console.log(err);
                        if (!err && info) {
                            const node = {
                                node_alias: process.env.NODE_ALIAS,
                                ip: process.env.NODE_IP,
                                lnd_port: process.env.NODE_LND_PORT,
                                relay_commit: commitHash,
                                public_ip: public_ip,
                                pubkey: owner.publicKey,
                                number_channels: channels.length,
                                number_active_channels: info.num_active_channels,
                                number_pending_channels: info.num_pending_channels,
                                number_peers: info.num_peers,
                                largest_local_balance: largestLocalBalance,
                                largest_remote_balance: largestRemoteBalance,
                                total_local_balance: totalLocalBalance,
                                lnd_version: info.version,
                                relay_version: tag,
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
                                non_zero_policies: nzp
                            };
                            resolve(node);
                        }
                    });
                });
            });
        }
        catch (e) {
            console.log('=>', e);
        }
    }));
}
exports.nodeinfo = nodeinfo;
function isClean() {
    return __awaiter(this, void 0, void 0, function* () {
        // has owner but with no auth token (id=1?)
        const cleanOwner = yield models_1.models.Contact.findOne({ where: { id: 1, isOwner: true, authToken: null } });
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
            order: [['createdAt', 'DESC']]
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
        const lightning = yield LND.loadLightning(false); // dont try proxy
        lightning.listChannels({}, (err, channelList) => __awaiter(this, void 0, void 0, function* () {
            if (err)
                return ret;
            if (!channelList)
                return ret;
            if (!channelList.channels)
                return ret;
            const { channels } = channelList;
            yield asyncForEach(channels, (chan) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const tryProxy = false;
                    const info = yield LND.getChanInfo(chan.chan_id, tryProxy);
                    if (!info)
                        return;
                    policies.forEach(p => {
                        if (info[p]) {
                            const fee_base_msat = parseInt(info[p].fee_base_msat);
                            const disabled = info[p].disabled;
                            if (fee_base_msat > 0 || disabled) {
                                ret.push({
                                    node: p,
                                    fee_base_msat,
                                    chan_id: chan.chan_id,
                                    disabled
                                });
                            }
                        }
                    });
                }
                catch (e) { }
            }));
            return ret;
        }));
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