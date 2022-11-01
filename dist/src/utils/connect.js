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
exports.connect = exports.genChannel = exports.connectPeer = exports.checkPeered = exports.getQR = exports.getIP = void 0;
const publicIp = require("public-ip");
const localip = require("ip");
const password_1 = require("./password");
const Lightning = require("../grpc/lightning");
const nodeinfo_1 = require("./nodeinfo");
const config_1 = require("./config");
const queries_1 = require("../controllers/queries");
const res_1 = require("./res");
const logger_1 = require("./logger");
const fs = require("fs");
const net = require("net");
const config = config_1.loadConfig();
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT';
function getIP() {
    return __awaiter(this, void 0, void 0, function* () {
        let theIP;
        const public_url = config.public_url;
        if (public_url)
            theIP = public_url;
        if (!theIP) {
            theIP = process.env.NODE_IP;
            if (!theIP) {
                try {
                    if (IS_GREENLIGHT) {
                        theIP = localip.address();
                    }
                    else {
                        theIP = yield publicIp.v4();
                    }
                }
                catch (e) {
                    //do nothing here
                }
            }
            const isIP = net.isIP(theIP);
            if (isIP) {
                // add port if its an IP address
                const port = config.node_http_port;
                theIP = port ? `${theIP}:${port}` : theIP;
            }
        }
        if (!theIP.includes('://')) {
            // no protocol
            if (config.node_http_protocol) {
                theIP = `${config.node_http_protocol}://${theIP}`;
            }
        }
        return theIP;
    });
}
exports.getIP = getIP;
function getQR() {
    return __awaiter(this, void 0, void 0, function* () {
        const theIP = yield getIP();
        return Buffer.from(`ip::${theIP}::${password_1.default || ''}`).toString('base64');
    });
}
exports.getQR = getQR;
function makeVarScript() {
    return __awaiter(this, void 0, void 0, function* () {
        const clean = yield nodeinfo_1.isClean();
        const isSignedUp = clean ? false : true;
        const channelList = yield Lightning.listChannels({});
        const { channels } = channelList;
        if (!channels || channels.length === 0) {
            return `<script>
  window.channelIsOpen=false;
  window.channelFeesBaseZero=false;
  window.hasRemoteBalance=false;
  window.isSignedUp=${isSignedUp};
</script>`;
        }
        const remoteBalances = channels.map((c) => parseInt(c.remote_balance));
        const totalRemoteBalance = remoteBalances.reduce((a, b) => a + b, 0);
        const hasRemoteBalance = totalRemoteBalance > 0 ? true : false;
        let channelFeesBaseZero = false;
        const policies = ['node1_policy', 'node2_policy'];
        yield asyncForEach(channels, (chan) => __awaiter(this, void 0, void 0, function* () {
            const info = yield Lightning.getChanInfo(chan.chan_id);
            if (!info)
                return;
            policies.forEach((p) => {
                if (info[p]) {
                    const fee_base_msat = parseInt(info[p].fee_base_msat);
                    if (fee_base_msat === 0) {
                        channelFeesBaseZero = true;
                    }
                }
            });
        }));
        return `<script>
  window.channelIsOpen=true;
  window.channelFeesBaseZero=${channelFeesBaseZero};
  window.hasRemoteBalance=${hasRemoteBalance};
  window.isSignedUp=${isSignedUp};
</script>`;
    });
}
function checkPeered(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const default_pubkey = '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f';
        const pubkey = req.body.pubkey || default_pubkey;
        try {
            let peered = false;
            let active = false;
            let channel_point = '';
            const peers = yield Lightning.listPeers();
            peers.peers.forEach((p) => {
                if (p.pub_key === pubkey)
                    peered = true;
            });
            const chans = yield Lightning.listChannels();
            chans.channels.forEach((ch) => {
                if (ch.remote_pubkey === pubkey) {
                    if (ch.active)
                        active = true;
                    channel_point = ch.channel_point;
                }
            });
            res_1.success(res, { peered, active, channel_point });
        }
        catch (e) {
            logger_1.sphinxLogger.error(`=> checkPeered failed ${e}`);
            res_1.failure(res, e);
        }
    });
}
exports.checkPeered = checkPeered;
function connectPeer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield Lightning.connectPeer({
                addr: {
                    pubkey: '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f',
                    host: '54.159.193.149:9735',
                },
            });
            res_1.success(res, 'ok');
        }
        catch (e) {
            logger_1.sphinxLogger.error(`=> connect peer failed ${e}`);
            res_1.failure(res, e);
        }
    });
}
exports.connectPeer = connectPeer;
function genChannel(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { amount } = req.body;
        if (!amount)
            return res_1.failure(res, 'no amount');
        try {
            yield Lightning.connectPeer({
                addr: {
                    pubkey: '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f',
                    host: '54.159.193.149:9735',
                },
            });
            const sat_per_byte = yield queries_1.getSuggestedSatPerByte();
            yield Lightning.openChannel({
                node_pubkey: '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f',
                local_funding_amount: amount,
                push_sat: Math.round(amount * 0.02),
                sat_per_byte,
            });
            res_1.success(res, 'ok');
        }
        catch (e) {
            logger_1.sphinxLogger.error(`=> connect failed ${e}`);
        }
    });
}
exports.genChannel = genChannel;
function greenlightConnect(req, res) {
    fs.readFile('public/index_greenlight.html', function (error, pgResp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (error) {
                res.writeHead(404);
                res.write('Contents you are looking are Not Found');
            }
            else {
                const htmlString = Buffer.from(pgResp).toString();
                const qr = yield getQR();
                const rep = htmlString.replace(/CONNECTION_STRING/g, qr);
                const final = Buffer.from(rep, 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(final);
            }
            res.end();
        });
    });
}
function connect(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (IS_GREENLIGHT)
            return greenlightConnect(req, res);
        fs.readFile('public/index.html', function (error, pgResp) {
            return __awaiter(this, void 0, void 0, function* () {
                if (error) {
                    res.writeHead(404);
                    res.write('Contents you are looking are Not Found');
                }
                else {
                    const newScript = yield makeVarScript();
                    const hub_pubkey = yield queries_1.get_hub_pubkey();
                    const htmlString = Buffer.from(pgResp).toString();
                    const qr = yield getQR();
                    const rep = htmlString.replace(/CONNECTION_STRING/g, qr);
                    const rep2 = rep.replace("<script>var hi='hello';</script>", newScript);
                    const rep3 = rep2.replace(/SPHINX_HUB_PUBKEY/g, hub_pubkey);
                    const final = Buffer.from(rep3, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(final);
                }
                res.end();
            });
        });
    });
}
exports.connect = connect;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=connect.js.map