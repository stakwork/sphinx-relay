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
const lightning_1 = require("../utils/lightning");
const publicIp = require("public-ip");
const gitinfo_1 = require("../utils/gitinfo");
const models_1 = require("../models");
function nodeinfo() {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        let public_ip = "";
        try {
            public_ip = yield publicIp.v4();
        }
        catch (e) { }
        const commitHash = yield gitinfo_1.checkCommitHash();
        const tag = yield gitinfo_1.checkTag();
        const lightning = lightning_1.loadLightning();
        const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
        const clean = yield isClean();
        try {
            lightning.channelBalance({}, (err, channelBalance) => {
                if (err)
                    console.log(err);
                // const { balance, pending_open_balance } = channelBalance
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
                                };
                                resolve(node);
                            }
                        });
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
        // has owner but with no auth token
        const cleanOwner = yield models_1.models.Contact.findOne({ where: { isOwner: true, authToken: null } });
        const msgs = yield models_1.models.Message.findAll();
        const allContacts = yield models_1.models.Contact.findAll();
        const noMsgs = msgs.length === 0;
        const onlyOneContact = allContacts.length === 1;
        if (cleanOwner && noMsgs && onlyOneContact)
            return true;
        return false;
    });
}
//# sourceMappingURL=nodeinfo.js.map