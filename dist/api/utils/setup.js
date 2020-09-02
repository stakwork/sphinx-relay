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
const gitinfo_1 = require("../utils/gitinfo");
const USER_VERSION = 6;
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
        addTableColumn('sphinx_chat_members', 'bot', 'BOOLEAN');
        addTableColumn('sphinx_chat_members', 'bot_prefix');
        addTableColumn('sphinx_chat_members', 'bot_maker_pubkey');
        addTableColumn('sphinx_chat_members', 'bot_uuid');
        addTableColumn('sphinx_bots', 'webhook');
        try {
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_bot_members (
      member_pubkey TEXT,
      tribe_uuid TEXT,
      msg_count BIGINT,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) { }
        try {
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_bots (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT,
      chat_id BIGINT,
      secret TEXT,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) { }
        addTableColumn('sphinx_chats', 'app_url');
        try {
            yield models_1.sequelize.query(`CREATE UNIQUE INDEX chat_member_index ON sphinx_chat_members(chat_id, contact_id);`);
        }
        catch (e) { }
        addTableColumn('sphinx_chats', 'private', 'BOOLEAN');
        addTableColumn('sphinx_chats', 'unlisted', 'BOOLEAN');
        addTableColumn('sphinx_chat_members', 'status', 'BIGINT');
        addTableColumn('sphinx_chats', 'seen', 'BOOLEAN');
        try {
            yield models_1.sequelize.query(`CREATE INDEX idx_messages_sender ON sphinx_messages (sender);`);
        }
        catch (e) { }
        addTableColumn('sphinx_contacts', 'notification_sound');
        //   try{
        //     await sequelize.query(`
        // CREATE TABLE sphinx_timers (
        //   id BIGINT,
        //   chat_id BIGINT,
        //   receiver BIGINT,
        //   millis BIGINT,
        //   msg_id BIGINT,
        //   amount DECIMAL
        // )`)
        //   } catch(e){}
        //   addTableColumn('sphinx_chats', 'escrow_amount', 'BIGINT')
        //   addTableColumn('sphinx_chats', 'escrow_millis', 'BIGINT')
        //   addTableColumn('sphinx_contacts', 'private_photo', 'BOOLEAN')
    });
}
function addTableColumn(table, column, type = 'TEXT') {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield models_1.sequelize.query(`alter table ${table} add ${column} ${type}`);
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
        const ip = process.env.NODE_IP;
        let public_ip;
        if (!ip) {
            try {
                public_ip = yield publicIp.v4();
            }
            catch (e) { }
        }
        else {
            public_ip = ip;
        }
        if (!public_ip) {
            console.log('=> no public IP provided');
            return;
        }
        let theIP = public_ip;
        // if(!theIP.includes(":")) theIP = public_ip+':3001'
        const b64 = Buffer.from(`ip::${theIP}::${password_1.default || ''}`).toString('base64');
        console.log('Scan this QR in Sphinx app:');
        console.log(b64);
        QRCode.toString(b64, { type: 'terminal' }, function (err, url) {
            console.log(url);
        });
    });
}
//# sourceMappingURL=setup.js.map