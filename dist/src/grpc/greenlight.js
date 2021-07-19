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
exports.recover = exports.register = exports.sign_challenge = exports.get_challenge = exports.schedule = exports.startGreenlightInit = exports.get_greenlight_grpc_uri = exports.loadScheduler = exports.initGreenlight = void 0;
const fs = require("fs");
const grpc = require("grpc");
const libhsmd = require("libhsmd");
const config_1 = require("../utils/config");
const ByteBuffer = require("bytebuffer");
const crypto = require("crypto");
const interfaces = require("./interfaces");
const lightning_1 = require("./lightning");
const config = config_1.loadConfig();
function initGreenlight() {
    return __awaiter(this, void 0, void 0, function* () {
        yield startGreenlightInit();
        yield streamHsmRequests();
    });
}
exports.initGreenlight = initGreenlight;
var schedulerClient = null;
const loadSchedulerCredentials = () => {
    var glCert = fs.readFileSync(config.scheduler_tls_location);
    var glPriv = fs.readFileSync(config.scheduler_key_location);
    var glChain = fs.readFileSync(config.scheduler_chain_location);
    return grpc.credentials.createSsl(glCert, glPriv, glChain);
};
function loadScheduler() {
    // 35.236.110.178:2601
    var descriptor = grpc.load("proto/scheduler.proto");
    var scheduler = descriptor.scheduler;
    var options = {
        "grpc.ssl_target_name_override": "localhost",
    };
    schedulerClient = new scheduler.Scheduler("35.236.110.178:2601", loadSchedulerCredentials(), options);
    return schedulerClient;
}
exports.loadScheduler = loadScheduler;
let GREENLIGHT_GRPC_URI = '';
function get_greenlight_grpc_uri() {
    return GREENLIGHT_GRPC_URI;
}
exports.get_greenlight_grpc_uri = get_greenlight_grpc_uri;
let GID;
function startGreenlightInit() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let needToRegister = false;
            const secretPath = config.hsm_secret_path || "./hsm_secret";
            let rootkey;
            if (!fs.existsSync(secretPath)) {
                needToRegister = true;
                rootkey = crypto.randomBytes(32).toString("hex");
            }
            else {
                rootkey = fs.readFileSync(secretPath).toString();
            }
            const msgHex = libhsmd.Init(rootkey, "bitcoin");
            const msg = Buffer.from(msgHex, "hex");
            // console.log("INIT MSG LENGTH", msg.length)
            const node_id = msg.subarray(2, 35);
            const bip32_key = msg.subarray(35, msg.length - 32);
            const bolt12_key = msg.subarray(msg.length - 32, msg.length);
            GID = {
                node_id: node_id.toString("hex"),
                bip32_key: bip32_key.toString("hex"),
                bolt12_key: bolt12_key.toString("hex"),
            };
            if (needToRegister) {
                yield registerGreenlight(GID, rootkey, secretPath);
            }
            const keyLoc = config.tls_key_location;
            const noNeedToRecover = fs.existsSync(keyLoc);
            if (!noNeedToRecover) {
                yield recoverGreenlight(GID);
            }
            const r = yield schedule(GID.node_id);
            console.log(r.node_id.toString('hex'));
        }
        catch (e) {
            console.log('initGreenlight error', e);
        }
    });
}
exports.startGreenlightInit = startGreenlightInit;
function schedule(pubkey) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const s = loadScheduler();
            s.schedule({
                node_id: ByteBuffer.fromHex(pubkey),
            }, (err, response) => {
                // console.log('=> schedule', err, response);
                if (!err) {
                    GREENLIGHT_GRPC_URI = response.grpc_uri;
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }
        catch (e) {
            console.log(e);
        }
    }));
}
exports.schedule = schedule;
function recoverGreenlight(gid) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const challenge = yield get_challenge(gid.node_id);
            const signature = yield sign_challenge(challenge);
            const res = yield recover(gid.node_id, challenge, signature);
            const keyLoc = config.tls_key_location || "./device-key.pem";
            const chainLoc = config.tls_chain_location || './device.crt';
            console.log("RECOVER KEY", keyLoc, res.device_key);
            fs.writeFileSync(keyLoc, res.device_key);
            fs.writeFileSync(chainLoc, res.device_cert);
        }
        catch (e) {
            console.log('Greenlight register error', e);
        }
    });
}
function registerGreenlight(gid, rootkey, secretPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const challenge = yield get_challenge(gid.node_id);
            const signature = yield sign_challenge(challenge);
            const res = yield register(gid.node_id, gid.bip32_key + gid.bolt12_key, challenge, signature);
            const keyLoc = config.tls_key_location || "./device-key.pem";
            const chainLoc = config.tls_chain_location || './device.crt';
            console.log("WITE KEY", keyLoc, res.device_key);
            fs.writeFileSync(keyLoc, res.device_key);
            fs.writeFileSync(chainLoc, res.device_cert);
            // after registered successfully
            fs.writeFileSync(secretPath, rootkey);
        }
        catch (e) {
            console.log('Greenlight register error', e);
        }
    });
}
function get_challenge(node_id) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const s = loadScheduler();
            s.getChallenge({
                node_id: ByteBuffer.fromHex(node_id),
                scope: 'REGISTER',
            }, (err, response) => {
                if (!err) {
                    resolve(Buffer.from(response.challenge).toString('hex'));
                }
                else {
                    reject(err);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    }));
}
exports.get_challenge = get_challenge;
function sign_challenge(challenge) {
    const pld = interfaces.greenlightSignMessagePayload(Buffer.from(challenge, 'hex'));
    const sig = libhsmd.Handle(1024, 0, null, pld);
    const sigBuf = Buffer.from(sig, 'hex');
    const sigBytes = sigBuf.subarray(2, 66);
    return sigBytes.toString('hex');
}
exports.sign_challenge = sign_challenge;
function register(pubkey, bip32_key, challenge, signature) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const s = loadScheduler();
            s.register({
                node_id: ByteBuffer.fromHex(pubkey),
                bip32_key: ByteBuffer.fromHex(bip32_key),
                network: "bitcoin",
                challenge: ByteBuffer.fromHex(challenge),
                signature: ByteBuffer.fromHex(signature),
            }, (err, response) => {
                console.log(err, response);
                if (!err) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    }));
}
exports.register = register;
function recover(pubkey, challenge, signature) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const s = loadScheduler();
            s.recover({
                node_id: ByteBuffer.fromHex(pubkey),
                challenge: ByteBuffer.fromHex(challenge),
                signature: ByteBuffer.fromHex(signature),
            }, (err, response) => {
                console.log(err, response);
                if (!err) {
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    }));
}
exports.recover = recover;
function streamHsmRequests() {
    return __awaiter(this, void 0, void 0, function* () {
        const capabilities_bitset = 1087; // 1 + 2 + 4 + 8 + 16 + 32 + 1024
        try {
            const lightning = yield lightning_1.loadLightning(true); // try proxy
            var call = lightning.streamHsmRequests({});
            call.on('data', function (response) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log("DATA", response);
                    try {
                        let sig = '';
                        if (response.context) {
                            const dbid = parseInt(response.context.dbid);
                            const peer = response.context.node_id.toString('hex');
                            sig = libhsmd.Handle(capabilities_bitset, peer, dbid, response.raw.toString('hex'));
                        }
                        else {
                            sig = libhsmd.Handle(capabilities_bitset, 0, null, response.raw.toString('hex'));
                        }
                        lightning.respondHsmRequest({
                            request_id: response.request_id,
                            raw: ByteBuffer.fromHex(sig)
                        }, (err, response) => {
                            if (err)
                                console.log('[HSMD] error', err);
                            else
                                console.log("[HSMD] success", response);
                        });
                    }
                    catch (e) {
                        console.log("[HSMD] failure", e);
                    }
                });
            });
            call.on('status', function (status) {
                console.log("[HSMD] Status", status.code, status);
            });
            call.on('error', function (err) {
                console.error('[HSMD] Error', err.code);
            });
            call.on('end', function () {
                console.log(`[HSMD] Closed stream`);
            });
        }
        catch (e) {
            console.log('[HSMD] last error:', e);
        }
    });
}
//# sourceMappingURL=greenlight.js.map