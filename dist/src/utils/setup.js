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
exports.setupDone = exports.runMigrations = exports.setupOwnerContact = exports.setupDatabase = exports.setupTransportToken = void 0;
const Lightning = require("../grpc/lightning");
const models_1 = require("../models");
const child_process_1 = require("child_process");
const QRCode = require("qrcode");
const gitinfo_1 = require("../utils/gitinfo");
const fs = require("fs");
const rsa = require("../crypto/rsa");
const nodeinfo_1 = require("./nodeinfo");
const connect_1 = require("./connect");
const config_1 = require("./config");
const migrate_1 = require("./migrate");
const proxy_1 = require("../utils/proxy");
const logger_1 = require("../utils/logger");
const USER_VERSION = 7;
const config = (0, config_1.loadConfig)();
const setupDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.sphinxLogger.info('starting setup', logger_1.logging.DB);
    yield setVersion();
    logger_1.sphinxLogger.info('sync now', logger_1.logging.DB);
    try {
        yield models_1.sequelize.sync();
        logger_1.sphinxLogger.info('done syncing', logger_1.logging.DB);
    }
    catch (e) {
        logger_1.sphinxLogger.info(['sync failed', e], logger_1.logging.DB);
    }
    yield (0, migrate_1.default)();
    logger_1.sphinxLogger.info('setup done', logger_1.logging.DB);
});
exports.setupDatabase = setupDatabase;
function setVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield models_1.sequelize.query(`PRAGMA user_version = ${USER_VERSION}`);
        }
        catch (e) {
            logger_1.sphinxLogger.error('setVersion failed', logger_1.logging.DB);
        }
    });
}
const setupOwnerContact = () => __awaiter(void 0, void 0, void 0, function* () {
    const owner = yield models_1.models.Contact.findOne({
        where: { isOwner: true, id: 1 },
    });
    if (!owner) {
        try {
            const info = yield Lightning.getInfo();
            const one = yield models_1.models.Contact.findOne({
                where: { isOwner: true, id: 1 },
            });
            if (!one) {
                let authToken = null;
                let tenant = null;
                // dont allow "signup" on root contact of proxy node
                if ((0, proxy_1.isProxy)()) {
                    authToken = '_';
                }
                else {
                    tenant = 1; // add tenant here
                }
                const contact = yield models_1.models.Contact.create({
                    id: 1,
                    publicKey: info.identity_pubkey,
                    isOwner: true,
                    authToken,
                    tenant,
                });
                logger_1.sphinxLogger.info(['created node owner contact, id:', contact.id], logger_1.logging.DB);
            }
        }
        catch (err) {
            logger_1.sphinxLogger.info(['error creating node owner due to lnd failure', err], logger_1.logging.DB);
        }
    }
});
exports.setupOwnerContact = setupOwnerContact;
const runMigrations = () => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((resolve, reject) => {
        const migration = (0, child_process_1.exec)('node_modules/.bin/sequelize db:migrate', { env: process.env }, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(true);
            }
        });
        // Forward stdout+stderr to this process
        migration.stdout.pipe(process.stdout);
        migration.stderr.pipe(process.stderr);
    });
});
exports.runMigrations = runMigrations;
function setupTransportToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const transportTokenKeys = yield rsa.genKeys();
        fs.writeFileSync(config.transportPrivateKeyLocation, transportTokenKeys.private);
        fs.writeFileSync(config.transportPublicKeyLocation, transportTokenKeys.public);
    });
}
exports.setupTransportToken = setupTransportToken;
function setupDone() {
    return __awaiter(this, void 0, void 0, function* () {
        yield printGitInfo();
        printQR();
    });
}
exports.setupDone = setupDone;
function printGitInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        const commitHash = yield (0, gitinfo_1.checkCommitHash)();
        const tag = yield (0, gitinfo_1.checkTag)();
        logger_1.sphinxLogger.info(`=> Relay version: ${tag}, commit: ${commitHash}`);
    });
}
function printQR() {
    return __awaiter(this, void 0, void 0, function* () {
        const b64 = yield (0, connect_1.getQR)();
        if (!b64) {
            logger_1.sphinxLogger.info('=> no public IP provided');
            return '';
        }
        logger_1.sphinxLogger.info(['>>', b64]);
        connectionStringFile(b64);
        const clean = yield (0, nodeinfo_1.isClean)();
        if (!clean)
            return; // skip it if already setup!
        logger_1.sphinxLogger.info('Scan this QR in Sphinx app:');
        QRCode.toString(b64, { type: 'terminal' }, function (err, url) {
            logger_1.sphinxLogger.info(url);
        });
    });
}
function connectionStringFile(str) {
    let connectStringPath = 'connection_string.txt';
    if ('connection_string_path' in config) {
        connectStringPath = config.connection_string_path;
    }
    fs.writeFile(connectStringPath || 'connection_string.txt', str, function (err) {
        if (err)
            logger_1.sphinxLogger.error(['ERROR SAVING connection_string.txt.', err]);
    });
}
//# sourceMappingURL=setup.js.map