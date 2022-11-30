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
exports.updateLsat = exports.setupPersonUuid = exports.setupDone = exports.runMigrations = exports.setupOwnerContact = exports.setupDatabase = void 0;
const Lightning = require("../grpc/lightning");
const models_1 = require("../models");
const child_process_1 = require("child_process");
const QRCode = require("qrcode");
const gitinfo = require("../utils/gitinfo");
const fs = require("fs");
const nodeinfo_1 = require("./nodeinfo");
const connect_1 = require("./connect");
const config_1 = require("./config");
const migrate_1 = require("./migrate");
const proxy_1 = require("../utils/proxy");
const logger_1 = require("../utils/logger");
const node_fetch_1 = require("node-fetch");
const sequelize_1 = require("sequelize");
const constants_1 = require("../constants");
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
                const contact = (yield models_1.models.Contact.create({
                    id: 1,
                    publicKey: info.identity_pubkey,
                    isOwner: true,
                    authToken,
                    tenant,
                }));
                logger_1.sphinxLogger.info(['created node owner contact, id:', contact.id], logger_1.logging.DB);
            }
        }
        catch (err) {
            logger_1.sphinxLogger.info(['error creating node owner due to lnd failure', err], logger_1.logging.DB);
        }
    }
});
exports.setupOwnerContact = setupOwnerContact;
const setupPersonUuid = () => __awaiter(void 0, void 0, void 0, function* () {
    let protocol = 'https';
    if (config.tribes_insecure)
        protocol = 'http';
    try {
        const contacts = (yield models_1.models.Contact.findAll({
            where: {
                isOwner: true,
                [sequelize_1.Op.or]: [{ personUuid: null }, { personUuid: '' }],
            },
        }));
        for (let i = 0; i < contacts.length; i++) {
            const tenant = contacts[i];
            const url = protocol + '://' + config.people_host + '/person/' + tenant.publicKey;
            const res = yield (0, node_fetch_1.default)(url);
            const person = yield res.json();
            if (person.uuid) {
                yield models_1.models.Contact.update({ personUuid: person.uuid }, { where: { id: tenant.id } });
            }
        }
    }
    catch (error) {
        console.log(error);
        logger_1.sphinxLogger.info(['error trying to set person uuid', error], logger_1.logging.DB);
    }
});
exports.setupPersonUuid = setupPersonUuid;
const updateLsat = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timestamp = new Date(1669658385 * 1000);
        const lsats = (yield models_1.models.Lsat.findAll({
            where: { createdAt: { [sequelize_1.Op.lt]: timestamp }, status: 1 },
        }));
        for (let i = 0; i < lsats.length; i++) {
            let lsat = lsats[i];
            lsat.update({ status: constants_1.default.lsat_statuses.expired });
        }
    }
    catch (error) {
        logger_1.sphinxLogger.info(['error trying to update lsat status', error], logger_1.logging.Lsat);
    }
});
exports.updateLsat = updateLsat;
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
function setupDone() {
    return __awaiter(this, void 0, void 0, function* () {
        yield printGitInfo();
        printQR();
    });
}
exports.setupDone = setupDone;
function printGitInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.sphinxLogger.info(`=> Relay version: ${gitinfo.tag}, commit: ${gitinfo.commitHash}`);
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