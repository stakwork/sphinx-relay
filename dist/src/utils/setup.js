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
exports.setupDone = exports.runMigrations = exports.setupOwnerContact = exports.setupDatabase = void 0;
const lightning_1 = require("./lightning");
const models_1 = require("../models");
const child_process_1 = require("child_process");
const QRCode = require("qrcode");
const gitinfo_1 = require("../utils/gitinfo");
const fs = require("fs");
const nodeinfo_1 = require("./nodeinfo");
const connect_1 = require("./connect");
const config_1 = require("./config");
const migrate_1 = require("./migrate");
const proxy_1 = require("../utils/proxy");
const USER_VERSION = 7;
const config = config_1.loadConfig();
const setupDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> [db] starting setup...');
    yield setVersion();
    try {
        yield models_1.sequelize.sync();
        console.log("=> [db] done syncing");
    }
    catch (e) {
        // console.log("db sync failed", e)
    }
    yield migrate_1.default();
    console.log('=> [db] setup done');
});
exports.setupDatabase = setupDatabase;
function setVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield models_1.sequelize.query(`PRAGMA user_version = ${USER_VERSION}`);
        }
        catch (e) {
            console.log('=> setVersion failed', e);
        }
    });
}
const setupOwnerContact = () => __awaiter(void 0, void 0, void 0, function* () {
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true, id: 1 } });
    if (!owner) {
        const lightning = yield lightning_1.loadLightning();
        lightning.getInfo({}, (err, info) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.log('[db] error creating node owner due to lnd failure', err);
            }
            else {
                try {
                    const one = yield models_1.models.Contact.findOne({ where: { isOwner: true, id: 1 } });
                    if (!one) {
                        let authToken = null;
                        let tenant = null;
                        // dont allow "signup" on root contact of proxy node
                        if (proxy_1.isProxy()) {
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
                            tenant
                        });
                        console.log('[db] created node owner contact, id:', contact.id);
                    }
                }
                catch (error) {
                    console.log('[db] error creating owner contact', error);
                }
            }
        }));
    }
});
exports.setupOwnerContact = setupOwnerContact;
const runMigrations = () => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((resolve, reject) => {
        const migration = child_process_1.exec('node_modules/.bin/sequelize db:migrate', { env: process.env }, (err, stdout, stderr) => {
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
        const commitHash = yield gitinfo_1.checkCommitHash();
        const tag = yield gitinfo_1.checkTag();
        console.log(`=> Relay version: ${tag}, commit: ${commitHash}`);
    });
}
function printQR() {
    return __awaiter(this, void 0, void 0, function* () {
        const b64 = yield connect_1.getQR();
        if (!b64) {
            console.log('=> no public IP provided');
            return '';
        }
        console.log('>>', b64);
        connectionStringFile(b64);
        const clean = yield nodeinfo_1.isClean();
        if (!clean)
            return; // skip it if already setup!
        console.log('Scan this QR in Sphinx app:');
        QRCode.toString(b64, { type: 'terminal' }, function (err, url) {
            console.log(url);
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
            console.log('ERROR SAVING connection_string.txt.', err);
    });
}
//# sourceMappingURL=setup.js.map