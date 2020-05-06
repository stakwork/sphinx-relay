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
const moment = require("moment");
const zbase32 = require("./zbase32");
const LND = require("./lightning");
const path = require("path");
const mqtt = require("mqtt");
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env];
let client;
function connect(connectedCallback, onMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const pwd = yield genSignedTimestamp();
        const info = yield LND.getInfo();
        console.log('[tribes] try to connect:', `tcp://${config.tribes_host}`);
        client = mqtt.connect(`tcp://${config.tribes_host}`, {
            username: info.identity_pubkey,
            password: pwd,
        });
        client.on('connect', function () {
            console.log("[tribes] connected!");
            if (connectedCallback)
                connectedCallback(client, info.identity_pubkey);
            // subscribe to all public groups here
            // that you are NOT admin of (dont sub to your own!)
        });
        client.on('close', function () {
            //console.log("MQTT CLOSED")
        });
        client.on('message', function (topic, message) {
            if (onMessage)
                onMessage(topic, message);
        });
    });
}
exports.connect = connect;
function subscribe(topic) {
    if (client)
        client.subscribe(topic);
}
exports.subscribe = subscribe;
function genSignedTimestamp() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = moment().unix();
        const tsBytes = Buffer.from(now.toString(16), 'hex');
        const sig = yield LND.signBuffer(tsBytes);
        const sigBytes = zbase32.decode(sig);
        const totalLength = tsBytes.length + sigBytes.length;
        const buf = Buffer.concat([tsBytes, sigBytes], totalLength);
        return urlBase64(buf);
    });
}
exports.genSignedTimestamp = genSignedTimestamp;
function verifySignedTimestamp(stsBase64) {
    return __awaiter(this, void 0, void 0, function* () {
        const stsBuf = Buffer.from(stsBase64, 'base64');
        const sig = stsBuf.subarray(4, 92);
        const sigZbase32 = zbase32.encode(sig);
        const r = yield LND.verifyBytes(stsBuf.subarray(0, 4), sigZbase32); // sig needs to be zbase32 :(
        if (r.valid) {
            return r.pubkey;
        }
        else {
            return false;
        }
    });
}
exports.verifySignedTimestamp = verifySignedTimestamp;
function getHost() {
    return config.tribes_host || '';
}
exports.getHost = getHost;
function urlBase64(buf) {
    return buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
}
//# sourceMappingURL=tribes.js.map