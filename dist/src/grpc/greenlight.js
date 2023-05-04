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
exports.streamHsmRequests = exports.recover = exports.register = exports.sign_challenge = exports.get_challenge = exports.schedule = exports.startGreenlightInit = exports.get_greenlight_grpc_uri = exports.keepalive = exports.initGreenlight = void 0;
const fs = require("fs");
const grpc = require("@grpc/grpc-js");
const proto_1 = require("./proto");
const libhsmd_1 = require("./libhsmd");
const config_1 = require("../utils/config");
const crypto = require("crypto");
const interfaces = require("./interfaces");
const lightning_1 = require("./lightning");
const Lightning = require("./lightning");
const logger_1 = require("../utils/logger");
let GID;
const config = (0, config_1.loadConfig)();
function initGreenlight() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('=> initGreenlight');
        // if (GID && GID.initialized) return
        yield startGreenlightInit();
        // await streamHsmRequests()
    });
}
exports.initGreenlight = initGreenlight;
function keepalive() {
    logger_1.sphinxLogger.info('=> Greenlight keepalive');
    setInterval(() => {
        Lightning.getInfo();
    }, 59000);
}
exports.keepalive = keepalive;
// let schedulerClient: SchedulerClient | undefined
const loadSchedulerCredentials = () => {
    const glCert = fs.readFileSync(config.scheduler_tls_location);
    const glPriv = fs.readFileSync(config.scheduler_key_location);
    const glChain = fs.readFileSync(config.scheduler_chain_location);
    return grpc.credentials.createSsl(glCert, glPriv, glChain);
};
function loadScheduler() {
    // 35.236.110.178:2601
    const descriptor = (0, proto_1.loadProto)('scheduler');
    const scheduler = descriptor.scheduler;
    const options = {
        'grpc.ssl_target_name_override': 'localhost',
    };
    return new scheduler.Scheduler('35.236.110.178:2601', loadSchedulerCredentials(), options);
}
let GREENLIGHT_GRPC_URI = '';
function get_greenlight_grpc_uri() {
    return GREENLIGHT_GRPC_URI;
}
exports.get_greenlight_grpc_uri = get_greenlight_grpc_uri;
function startGreenlightInit() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('=> startGreenlightInit');
        try {
            let needToRegister = false;
            const secretPath = config.hsm_secret_path;
            let rootkey;
            if (!fs.existsSync(secretPath)) {
                needToRegister = true;
                rootkey = crypto.randomBytes(32).toString('hex');
            }
            else {
                rootkey = fs.readFileSync(secretPath).toString('hex');
            }
            const msgHex = libhsmd_1.default.Init(rootkey, 'bitcoin');
            const msg = Buffer.from(msgHex, 'hex');
            // console.log("INIT MSG LENGTH", msg.length)
            const node_id = msg.subarray(2, 35);
            const bip32_key = msg.subarray(35, msg.length - 32);
            const bolt12_key = msg.subarray(msg.length - 32, msg.length);
            GID = {
                node_id: node_id.toString('hex'),
                bip32_key: bip32_key.toString('hex'),
                bolt12_key: bolt12_key.toString('hex'),
                initialized: false,
            };
            if (needToRegister) {
                yield registerGreenlight(GID, rootkey, secretPath);
            }
            const keyLoc = config.cln_device_key;
            const noNeedToRecover = fs.existsSync(keyLoc);
            if (!noNeedToRecover) {
                yield recoverGreenlight(GID);
            }
            const r = yield schedule(GID.node_id);
            logger_1.sphinxLogger.info('Greenlight pubkey', r.node_id.toString('hex'));
            GID.initialized = true;
        }
        catch (e) {
            logger_1.sphinxLogger.error(`initGreenlight error ${e}`);
        }
    });
}
exports.startGreenlightInit = startGreenlightInit;
function schedule(pubkey) {
    logger_1.sphinxLogger.info('=> Greenlight schedule');
    return new Promise((resolve, reject) => {
        try {
            const s = loadScheduler();
            s.schedule({
                node_id: Buffer.from(pubkey, 'hex'),
            }, (err, response) => {
                // console.log('=> schedule', err, response);
                if (!err && response) {
                    GREENLIGHT_GRPC_URI = response.grpc_uri;
                    resolve(response);
                }
                else {
                    reject(err);
                }
            });
        }
        catch (e) {
            logger_1.sphinxLogger.error(e);
        }
    });
}
exports.schedule = schedule;
function recoverGreenlight(gid) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info('=> recoverGreenlight');
        try {
            const challenge = yield get_challenge(gid.node_id);
            const signature = yield sign_challenge(challenge);
            const res = yield recover(gid.node_id, challenge, signature);
            const keyLoc = config.cln_device_key;
            const certLoc = config.cln_device_cert;
            logger_1.sphinxLogger.info(`RECOVER KEY ${keyLoc} ${res.device_key}`);
            fs.writeFileSync(keyLoc, res.device_key);
            fs.writeFileSync(certLoc, res.device_cert);
            writeTlsLocation();
        }
        catch (e) {
            logger_1.sphinxLogger.info(`Greenlight register error ${e}`);
        }
    });
}
function writeTlsLocation() {
    const glCert = fs.readFileSync(config.scheduler_tls_location);
    if (glCert) {
        fs.writeFileSync(config.cln_ca_cert, glCert);
    }
}
function registerGreenlight(gid, rootkey, secretPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.sphinxLogger.info('=> registerGreenlight');
            const challenge = yield get_challenge(gid.node_id);
            const signature = yield sign_challenge(challenge);
            const res = yield register(gid.node_id, gid.bip32_key + gid.bolt12_key, challenge, signature);
            const keyLoc = config.cln_device_key;
            const certLoc = config.cln_device_cert;
            logger_1.sphinxLogger.info(`WRITE KEY ${keyLoc} ${res.device_key}`);
            fs.writeFileSync(keyLoc, res.device_key);
            fs.writeFileSync(certLoc, res.device_cert);
            writeTlsLocation();
            // after registered successfully
            fs.writeFileSync(secretPath, Buffer.from(rootkey, 'hex'));
        }
        catch (e) {
            logger_1.sphinxLogger.error(`Greenlight register error ${e}`);
        }
    });
}
function get_challenge(node_id) {
    return new Promise((resolve, reject) => {
        try {
            const s = loadScheduler();
            s.getChallenge({
                node_id: Buffer.from(node_id, 'hex'),
                scope: 'REGISTER',
            }, (err, response) => {
                if (!err && response) {
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
    });
}
exports.get_challenge = get_challenge;
function sign_challenge(challenge) {
    const pld = interfaces.greenlightSignMessagePayload(Buffer.from(challenge, 'hex'));
    const sig = libhsmd_1.default.Handle(1024, 0, null, pld);
    const sigBuf = Buffer.from(sig, 'hex');
    const sigBytes = sigBuf.subarray(2, 66);
    return sigBytes.toString('hex');
}
exports.sign_challenge = sign_challenge;
function register(pubkey, bip32_key, challenge, signature) {
    return new Promise((resolve, reject) => {
        try {
            const s = loadScheduler();
            s.register({
                node_id: Buffer.from(pubkey, 'hex'),
                bip32_key: Buffer.from(bip32_key, 'hex'),
                network: 'bitcoin',
                challenge: Buffer.from(challenge, 'hex'),
                signature: Buffer.from(signature, 'hex'),
            }, (err, response) => {
                logger_1.sphinxLogger.info(`${err} ${response}`);
                if (!err && response) {
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
    });
}
exports.register = register;
function recover(pubkey, challenge, signature) {
    return new Promise((resolve, reject) => {
        try {
            const s = loadScheduler();
            s.recover({
                node_id: Buffer.from(pubkey, 'hex'),
                challenge: Buffer.from(challenge, 'hex'),
                signature: Buffer.from(signature, 'hex'),
            }, (err, response) => {
                logger_1.sphinxLogger.info(`${err} ${response}`);
                if (!err && response) {
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
    });
}
exports.recover = recover;
function streamHsmRequests() {
    return __awaiter(this, void 0, void 0, function* () {
        const capabilities_bitset = 1087; // 1 + 2 + 4 + 8 + 16 + 32 + 1024
        try {
            const lightning = yield (0, lightning_1.loadLightning)(true); // try proxy
            const call = lightning.streamHsmRequests({});
            call.on('data', function (response) {
                return __awaiter(this, void 0, void 0, function* () {
                    logger_1.sphinxLogger.info(`DATA ${response}`);
                    try {
                        let sig = '';
                        if (response.context) {
                            const dbid = parseInt(response.context.dbid);
                            const peer = dbid ? response.context.node_id.toString('hex') : null;
                            sig = libhsmd_1.default.Handle(capabilities_bitset, dbid, peer, response.raw.toString('hex'));
                        }
                        else {
                            logger_1.sphinxLogger.info(`RAW ====== `);
                            logger_1.sphinxLogger.info(response.raw.toString('hex'));
                            sig = libhsmd_1.default.Handle(capabilities_bitset, 0, null, response.raw.toString('hex'));
                        }
                        ;
                        lightning.respondHsmRequest({
                            request_id: response.request_id,
                            raw: Buffer.from(sig, 'hex'),
                        }, (err, response) => {
                            if (err)
                                logger_1.sphinxLogger.error(`[HSMD] error ${err}`);
                            else
                                logger_1.sphinxLogger.info(`[HSMD] success ${response}`);
                        });
                    }
                    catch (e) {
                        logger_1.sphinxLogger.error(`[HSMD] failure ${e}`);
                    }
                });
            });
            call.on('status', function (status) {
                logger_1.sphinxLogger.info(`[HSMD] Status ${status.code} ${status}`);
            });
            call.on('error', function (err) {
                logger_1.sphinxLogger.error(`[HSMD] Error ${err.name} ${err.message}`);
            });
            call.on('end', function () {
                logger_1.sphinxLogger.info(`[HSMD] Closed stream`);
            });
        }
        catch (e) {
            logger_1.sphinxLogger.error(`[HSMD] last error: ${e}`);
        }
    });
}
exports.streamHsmRequests = streamHsmRequests;
//# sourceMappingURL=greenlight.js.map