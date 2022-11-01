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
exports.makeJwtArgs = exports.getTimestamp = exports.sleep = exports.memeProtocol = exports.getToken = exports.arraysEqual = exports.iterate = exports.asyncForEach = exports.randomText = exports.makeRelayRequest = exports.makeArgs = void 0;
const http = require("ava-http");
const rsa = require("../../crypto/rsa");
const moment = require("moment");
const config_1 = require("../config");
const hmac = require("../../crypto/hmac");
const makeArgs = (node, body = {}, options) => {
    const currentTime = moment().unix();
    const headers = {};
    if (options && options.hmacOptions) {
        const rawBody = JSON.stringify(body);
        const { key, method, path } = options.hmacOptions;
        const message = `${method}|${path}|${rawBody}`;
        const sig = hmac.sign(message, key).toString();
        headers['x-hmac'] = sig;
    }
    if (options && options.useTransportToken) {
        headers['x-transport-token'] = rsa.encrypt(node.transportToken, `${node.authToken}|${currentTime.toString()}`);
    }
    else {
        headers['x-user-token'] = node.authToken;
    }
    return { body, headers };
};
exports.makeArgs = makeArgs;
const makeRelayRequest = (method, path, node, body
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) => __awaiter(void 0, void 0, void 0, function* () {
    const reqFunc = http[method];
    const { response } = yield reqFunc(node.external_ip + path, exports.makeArgs(node, body));
    return response;
});
exports.makeRelayRequest = makeRelayRequest;
function randomText() {
    const text = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5);
    return text;
}
exports.randomText = randomText;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
exports.asyncForEach = asyncForEach;
function iterate(nodes, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        // dont iterate
        if (!config_1.config.iterate) {
            return callback(nodes[0], nodes[1]);
        }
        // iterate through all node combinations
        const already = [];
        yield asyncForEach(nodes, (n1) => __awaiter(this, void 0, void 0, function* () {
            yield asyncForEach(nodes, (n2) => __awaiter(this, void 0, void 0, function* () {
                if (n1.pubkey !== n2.pubkey) {
                    const has = already.find((a) => {
                        return a.includes(n1.pubkey) && a.includes(n2.pubkey);
                    });
                    if (!has) {
                        already.push(`${n1.pubkey}-${n2.pubkey}`);
                        yield callback(n1, n2);
                    }
                }
            }));
        }));
    });
}
exports.iterate = iterate;
function arraysEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
exports.arraysEqual = arraysEqual;
function getToken(t, node) {
    return __awaiter(this, void 0, void 0, function* () {
        //A NODE GETS A SERVER TOKEN FOR POSTING TO MEME SERVER
        const protocol = memeProtocol(config_1.config.memeHost);
        //get authentication challenge from meme server
        const r = yield http.get(`${protocol}://${config_1.config.memeHost}/ask`);
        t.truthy(r, 'r should exist');
        t.truthy(r.challenge, 'r.challenge should exist');
        //call relay server with challenge
        const r2 = yield http.get(node.external_ip + `/signer/${r.challenge}`, exports.makeArgs(node));
        t.true(r2.success, 'r2 should exist');
        t.truthy(r2.response.sig, 'r2.sig should exist');
        //get server token
        const r3 = yield http.post(`${protocol}://${config_1.config.memeHost}/verify`, {
            form: { id: r.id, sig: r2.response.sig, pubkey: node.pubkey },
        });
        t.truthy(r3, 'r3 should exist');
        t.truthy(r3.token, 'r3.token should exist');
        return r3.token;
    });
}
exports.getToken = getToken;
function memeProtocol(host) {
    let p = 'https';
    if (host.includes('localhost'))
        p = 'http';
    return p;
}
exports.memeProtocol = memeProtocol;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
exports.sleep = sleep;
function getTimestamp() {
    const dateq = moment().utc().format('YYYY-MM-DD%20HH:mm:ss');
    return dateq;
}
exports.getTimestamp = getTimestamp;
function makeJwtArgs(jwt, body) {
    return {
        headers: { 'x-jwt': jwt },
        body,
    };
}
exports.makeJwtArgs = makeJwtArgs;
//# sourceMappingURL=helpers.js.map