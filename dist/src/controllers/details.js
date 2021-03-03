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
exports.getNodeInfo = exports.getLocalRemoteBalance = exports.getBalance = exports.getChannels = exports.getInfo = exports.getLogsSince = exports.checkRoute = exports.getAppVersions = void 0;
const lightning_1 = require("../utils/lightning");
const res_1 = require("../utils/res");
const readLastLines = require("read-last-lines");
const nodeinfo_1 = require("../utils/nodeinfo");
const constants_1 = require("../constants");
const models_1 = require("../models");
const config_1 = require("../utils/config");
const hub_1 = require("../hub");
const config = config_1.loadConfig();
function getAppVersions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const vs = yield hub_1.getAppVersionsFromHub();
        if (vs) {
            res_1.success(res, vs);
        }
        else {
            res_1.failure(res, 'Could not load app versions');
        }
    });
}
exports.getAppVersions = getAppVersions;
const checkRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return;
    const { pubkey, amount, route_hint } = req.query;
    if (!(pubkey && pubkey.length === 66))
        return res_1.failure(res, 'wrong pubkey');
    const owner = req.owner;
    try {
        const amt = parseInt(amount) || constants_1.default.min_sat_amount;
        const r = yield lightning_1.queryRoute(pubkey, amt, route_hint || '', owner.publicKey);
        res_1.success(res, r);
    }
    catch (e) {
        res_1.failure(res, e);
    }
});
exports.checkRoute = checkRoute;
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
                        var linesArray = lines.split('\n');
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
            res_1.success(res, txt);
        else
            res_1.failure(res, err);
    });
}
exports.getLogsSince = getLogsSince;
const getInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return;
    const lightning = yield lightning_1.loadLightning(true, req.owner.publicKey);
    var request = {};
    lightning.getInfo(request, function (err, response) {
        res.status(200);
        if (err == null) {
            res.json({ success: true, response });
        }
        else {
            res.json({ success: false });
        }
        res.end();
    });
});
exports.getInfo = getInfo;
const getChannels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return;
    const lightning = yield lightning_1.loadLightning(true, req.owner.publicKey); // try proxy
    var request = {};
    lightning.listChannels(request, function (err, response) {
        res.status(200);
        if (err == null) {
            res.json({ success: true, response });
        }
        else {
            res.json({ success: false });
        }
        res.end();
    });
});
exports.getChannels = getChannels;
const getBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return;
    const tenant = req.owner.id;
    var date = new Date();
    date.setMilliseconds(0);
    const owner = yield models_1.models.Contact.findOne({ where: { id: tenant } });
    owner.update({ lastActive: date });
    res.status(200);
    try {
        const response = yield lightning_1.channelBalance(owner.publicKey);
        // console.log("=> balance response", response)
        const channelList = yield lightning_1.listChannels({}, owner.publicKey);
        const { channels } = channelList;
        // console.log("=> balance channels", channels)
        const reserve = channels.reduce((a, chan) => a + parseInt(chan.local_chan_reserve_sat), 0);
        res.json({
            success: true,
            response: {
                reserve,
                full_balance: parseInt(response.balance),
                balance: parseInt(response.balance) - reserve,
                pending_open_balance: parseInt(response.pending_open_balance),
            }
        });
    }
    catch (e) {
        console.log("ERROR getBalance", e);
        res.json({ success: false });
    }
    res.end();
});
exports.getBalance = getBalance;
const getLocalRemoteBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return;
    const lightning = yield lightning_1.loadLightning(true, req.owner.publicKey); // try proxy
    lightning.listChannels({}, (err, channelList) => {
        const { channels } = channelList;
        const localBalances = channels.map(c => c.local_balance);
        const remoteBalances = channels.map(c => c.remote_balance);
        const totalLocalBalance = localBalances.reduce((a, b) => parseInt(a) + parseInt(b), 0);
        const totalRemoteBalance = remoteBalances.reduce((a, b) => parseInt(a) + parseInt(b), 0);
        res.status(200);
        if (err == null) {
            res.json({ success: true, response: { local_balance: totalLocalBalance, remote_balance: totalRemoteBalance } });
        }
        else {
            res.json({ success: false });
        }
        res.end();
    });
});
exports.getLocalRemoteBalance = getLocalRemoteBalance;
const getNodeInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var ipOfSource = req.connection.remoteAddress;
    if (!(ipOfSource.includes('127.0.0.1') || ipOfSource.includes('localhost'))) {
        res.status(401);
        res.end();
        return;
    }
    const node = yield nodeinfo_1.nodeinfo();
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
//# sourceMappingURL=details.js.map