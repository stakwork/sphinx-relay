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
const lightning_1 = require("./lightning");
const models_1 = require("../models");
const child_process_1 = require("child_process");
const QRCode = require("qrcode");
const publicIp = require("public-ip");
const password_1 = require("../utils/password");
const USER_VERSION = 1;
const setupDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> [db] starting setup...');
    yield setVersion();
    try {
        yield models_1.sequelize.sync();
        console.log("=> [db] done syncing");
    }
    catch (e) {
        console.log("db sync failed", e);
    }
    yield migrate();
    setupOwnerContact();
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
function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield models_1.sequelize.query(`alter table sphinx_invites add invoice text`);
        }
        catch (e) {
            //console.log('=> migrate failed',e)
        }
    });
}
const setupOwnerContact = () => __awaiter(void 0, void 0, void 0, function* () {
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    if (!owner) {
        const lightning = yield lightning_1.loadLightning();
        lightning.getInfo({}, (err, info) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.log('[db] error creating node owner due to lnd failure', err);
            }
            else {
                try {
                    const one = yield models_1.models.Contact.findOne({ where: { id: 1 } });
                    if (!one) {
                        const contact = yield models_1.models.Contact.create({
                            id: 1,
                            publicKey: info.identity_pubkey,
                            isOwner: true,
                            authToken: null
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
        const migrate = child_process_1.exec('node_modules/.bin/sequelize db:migrate', { env: process.env }, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
        // Forward stdout+stderr to this process
        migrate.stdout.pipe(process.stdout);
        migrate.stderr.pipe(process.stderr);
    });
});
exports.runMigrations = runMigrations;
function printQR() {
    return __awaiter(this, void 0, void 0, function* () {
        const ip = process.env.NODE_IP;
        let public_ip;
        if (!ip) {
            try {
                public_ip = yield publicIp.v4();
            }
            catch (e) {
                console.log(e);
            }
        }
        else {
            public_ip = ip;
        }
        if (!public_ip)
            return;
        const pwd = password_1.default || '';
        console.log('pass:', pwd);
        const b64 = Buffer.from(`ip:${public_ip}:${pwd}`).toString('base64');
        console.log('=>', b64);
        console.log('Scan this QR in Sphinx app:');
        QRCode.toString(b64, { type: 'terminal' }, function (err, url) {
            console.log(url);
        });
    });
}
exports.printQR = printQR;
//# sourceMappingURL=setup.js.map