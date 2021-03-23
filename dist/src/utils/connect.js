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
exports.connect = exports.getQR = void 0;
const publicIp = require("public-ip");
const password_1 = require("./password");
const LND = require("./lightning");
const nodeinfo_1 = require("./nodeinfo");
const config_1 = require("./config");
const queries_1 = require("../controllers/queries");
const fs = require('fs');
const config = config_1.loadConfig();
function getQR() {
    return __awaiter(this, void 0, void 0, function* () {
        let theIP;
        const public_url = config.public_url;
        if (public_url)
            theIP = public_url;
        if (!theIP) {
            const ip = process.env.NODE_IP;
            if (!ip) {
                try {
                    theIP = yield publicIp.v4();
                }
                catch (e) { }
            }
            else {
                // const port = config.node_http_port
                // theIP = port ? `${ip}:${port}` : ip
                theIP = ip;
            }
        }
        return Buffer.from(`ip::${theIP}::${password_1.default || ''}`).toString('base64');
    });
}
exports.getQR = getQR;
function makeVarScript() {
    return __awaiter(this, void 0, void 0, function* () {
        const clean = yield nodeinfo_1.isClean();
        const isSignedUp = clean ? false : true;
        const channelList = yield LND.listChannels({});
        const { channels } = channelList;
        if (!channels || channels.length === 0) {
            return `<script>
  window.channelIsOpen=false;
  window.channelFeesBaseZero=false;
  window.hasRemoteBalance=false;
  window.isSignedUp=${isSignedUp};
</script>`;
        }
        const remoteBalances = channels.map((c) => c.remote_balance);
        const totalRemoteBalance = remoteBalances.reduce((a, b) => parseInt(a) + parseInt(b), 0);
        const hasRemoteBalance = totalRemoteBalance > 0 ? true : false;
        let channelFeesBaseZero = false;
        const policies = ['node1_policy', 'node2_policy'];
        yield asyncForEach(channels, (chan) => __awaiter(this, void 0, void 0, function* () {
            const info = yield LND.getChanInfo(chan.chan_id);
            if (!info)
                return;
            policies.forEach(p => {
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
function connect(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        fs.readFile("public/index.html", function (error, pgResp) {
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