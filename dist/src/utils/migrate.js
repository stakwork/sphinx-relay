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
const helpers_1 = require("../helpers");
const models_1 = require("../models");
const constants_1 = require("../constants");
const logger_1 = require("./logger");
function migrateMuted() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chats = (yield models_1.models.Chat.findAll());
            let mig = false;
            chats.forEach((c) => {
                if (c.notify === null) {
                    mig = true;
                }
            });
            if (!mig)
                return;
            console.log('===========> migrate is_muted to notify!');
            yield (0, helpers_1.asyncForEach)(chats, (c) => __awaiter(this, void 0, void 0, function* () {
                if (c.notify === null) {
                    yield c.update({
                        notify: c.isMuted
                            ? constants_1.default.notify_levels.mute
                            : constants_1.default.notify_levels.all,
                    });
                }
            }));
            console.log('===========> finished migrating is_muted to notify!');
        }
        catch (e) {
            console.log('error migrating muted,', e);
        }
    });
}
function clearTransportTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        yield models_1.models.RequestsTransportTokens.destroy({
            truncate: true,
        });
    });
}
function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        addTableColumn('sphinx_contacts', 'admin_token');
        addTableColumn('sphinx_contacts', 'last_timestamp', 'BIGINT');
        yield clearTransportTokens();
        addTableColumn('sphinx_contacts', 'is_admin', 'BOOLEAN');
        addTableColumn('sphinx_contacts', 'push_kit_token');
        addTableColumn('sphinx_chats', 'notify', 'BIGINT');
        addTableColumn('sphinx_chats', 'default_join', 'BOOLEAN');
        yield migrateMuted();
        addTableColumn('sphinx_messages', 'push', 'BOOLEAN');
        addTableColumn('sphinx_messages', 'forwarded_sats', 'BOOLEAN');
        addTableColumn('sphinx_messages', 'person', 'TEXT');
        addTableColumn('sphinx_messages', 'recipient_alias');
        addTableColumn('sphinx_messages', 'recipient_pic');
        addTableColumn('sphinx_contacts', 'hmac_key');
        addTableColumn('sphinx_chats', 'feed_type', 'INT');
        addTableColumn('sphinx_contacts', 'blocked', 'BOOLEAN');
        addTableColumn('sphinx_contacts', 'price_to_meet', 'BIGINT');
        addTableColumn('sphinx_contacts', 'unmet', 'BOOLEAN');
        addTableColumn('sphinx_contacts', 'person_uuid', 'TEXT');
        addTableColumn('sphinx_chats', 'skip_broadcast_joins', 'BOOLEAN');
        addTableColumn('sphinx_chats', 'pin');
        addTableColumn('sphinx_chats', 'profile_filters', 'TEXT');
        addTableColumn('sphinx_chat_members', 'total_earned', 'BIGINT');
        addTableColumn('sphinx_chat_members', 'reputation', 'BIGINT');
        addTenant('sphinx_chat_members');
        addTenant('sphinx_chats');
        addTenant('sphinx_bots');
        addTenant('sphinx_contacts');
        addTenant('sphinx_messages');
        addTenant('sphinx_bot_members');
        addTenant('sphinx_chat_bots');
        addTenant('sphinx_invites');
        addTenant('sphinx_media_keys');
        addTenant('sphinx_subscriptions');
        addTenant('sphinx_timers');
        addTableColumn('sphinx_contacts', 'route_hint');
        addTableColumn('sphinx_chat_bots', 'bot_maker_route_hint');
        addTableColumn('sphinx_accountings', 'route_hint');
        try {
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_accountings (
      id BIGINT NOT NULL PRIMARY KEY,
      date DATETIME,
      pubkey TEXT,
      onchain_address TEXT,
      amount BIGINT,
      source_app TEXT,
      status BIGINT,
      error TEXT,
      chan_id BIGINT,
      funding_txid TEXT,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            //Do nothing here
        }
        addTableColumn('sphinx_accountings', 'funding_txid');
        addTableColumn('sphinx_accountings', 'onchain_txid');
        addTableColumn('sphinx_accountings', 'commit_fee', 'BIGINT');
        addTableColumn('sphinx_accountings', 'local_reserve', 'BIGINT');
        addTableColumn('sphinx_accountings', 'remote_reserve', 'BIGINT');
        addTableColumn('sphinx_accountings', 'extra_amount', 'BIGINT');
        addTableColumn('sphinx_chat_members', 'last_alias');
        addTableColumn('sphinx_chats', 'my_photo_url');
        addTableColumn('sphinx_chats', 'my_alias');
        addTableColumn('sphinx_messages', 'sender_pic');
        addTableColumn('sphinx_messages', 'network_type', 'INTEGER');
        addTableColumn('sphinx_messages', 'parent_id', 'INTEGER');
        addTableColumn('sphinx_chats', 'meta');
        addTableColumn('sphinx_contacts', 'tip_amount', 'BIGINT');
        addTableColumn('sphinx_contacts', 'last_active', 'DATETIME');
        try {
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_chat_bots (
      id BIGINT NOT NULL PRIMARY KEY,
      chat_id BIGINT,
      bot_uuid TEXT,
      bot_type INT,
      bot_prefix TEXT,
      bot_maker_pubkey TEXT,
      msg_types TEXT,
      meta TEXT,
      price_per_use INT,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            //Do nothing here
        }
        try {
            yield models_1.sequelize.query(`CREATE UNIQUE INDEX chat_bot_index ON sphinx_chat_bots(chat_id, bot_uuid);`);
        }
        catch (e) {
            //Do nothing here
        }
        addTableColumn('sphinx_bots', 'webhook');
        addTableColumn('sphinx_bots', 'uuid');
        addTableColumn('sphinx_bots', 'price_per_use', 'INT');
        try {
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_bot_members (
      id BIGINT NOT NULL PRIMARY KEY,
      member_pubkey TEXT,
      tribe_uuid TEXT,
      msg_count BIGINT,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            //Do nothing here
        }
        addTableColumn('sphinx_bot_members', 'bot_id');
        //////////
        try {
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_bots (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT,
      secret TEXT,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            //Do nothing here
        }
        addTableColumn('sphinx_chats', 'app_url');
        addTableColumn('sphinx_chats', 'feed_url');
        try {
            yield models_1.sequelize.query(`CREATE UNIQUE INDEX chat_member_index ON sphinx_chat_members(chat_id, contact_id);`);
        }
        catch (e) {
            //Do nothing here
        }
        addTableColumn('sphinx_chats', 'private', 'BOOLEAN');
        addTableColumn('sphinx_chats', 'unlisted', 'BOOLEAN');
        addTableColumn('sphinx_chat_members', 'status', 'BIGINT');
        addTableColumn('sphinx_chats', 'seen', 'BOOLEAN');
        try {
            yield models_1.sequelize.query(`CREATE INDEX idx_messages_sender ON sphinx_messages (sender);`);
        }
        catch (e) {
            //Do nothing here
        }
        addTableColumn('sphinx_contacts', 'notification_sound');
        addTableColumn('sphinx_contacts', 'from_group', 'BOOLEAN');
        addTableColumn('sphinx_contacts', 'private_photo', 'BOOLEAN');
        addTableColumn('sphinx_chats', 'escrow_amount', 'BIGINT');
        addTableColumn('sphinx_chats', 'escrow_millis', 'BIGINT');
        // add LSAT table
        try {
            logger_1.sphinxLogger.info('adding lsat table', logger_1.logging.DB);
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_lsats (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      identifier TEXT,
      created_at DATETIME,
      updated_at DATETIME,
      macaroon TEXT,
      payment_request TEXT,
      preimage TEXT,
      issuer TEXT,
      paths TEXT,
      metadata TEXT,
      tenant BIGINT
    )`);
        }
        catch (e) {
            // sphinxLogger.error(['problem adding lsat table:', e.message], logging.DB)
        }
        // Add status column to sphinx_lsats
        addTableColumn('sphinx_lsats', 'status', 'INT');
        // add RequestTransportToken table
        try {
            logger_1.sphinxLogger.info('adding requestsTransportTokens table', logger_1.logging.DB);
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_requests_transport_tokens (
      id INTEGER NOT NULL PRIMARY KEY,
      transport_token TEXT,
			created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            //Do nothing here
        }
        // add actionHistory table
        try {
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_action_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      meta_data TEXT,
      tenant INTEGER,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )`);
        }
        catch (e) {
            //Do nothing here
        }
        addTableColumn('sphinx_action_history', 'action_type', 'INT');
        addTableColumn('sphinx_chats', 'call_recording', 'INT');
        addTableColumn('sphinx_chats', 'meme_server_location', 'TEXT');
        addTableColumn('sphinx_chats', 'jitsi_server', 'TEXT');
        addTableColumn('sphinx_chats', 'stakwork_api_key', 'TEXT');
        addTableColumn('sphinx_chats', 'stakwork_webhook', 'TEXT');
        // add call recording table
        try {
            logger_1.sphinxLogger.info('adding call recording table', logger_1.logging.DB);
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_call_recording (
      id BIGINT NOT NULL PRIMARY KEY,
      recording_id TEXT,
      created_at DATETIME,
      updated_at DATETIME,
      created_by TEXT,
      file_name TEXT,
      participants INTEGER,
      call_length BIGINT,
      chat_id INTEGER,
      status INTEGER,
      stakwork_project_id TEXT
    )`);
        }
        catch (e) {
            // sphinxLogger.error(['problem adding call recording table:', e.message], logging.DB)
        }
        // add content feed status
        // @Column
        // tenant: number
        try {
            logger_1.sphinxLogger.info('adding content feed status table', logger_1.logging.DB);
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_content_feed_status (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      feed_id TEXT NOT NULL,
      feed_url TEXT NOT NULL,
      subscription_status BOOLEAN NOT NULL,
      item_id TEXT,
      episodes_status TEXT,
      chat_id INTEGER,
      sats_per_minute INTEGER,
      player_speed REAL,
      tenant INTEGER,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            // sphinxLogger.error(['problem adding content feed status table:', e.message], logging.DB)
        }
        try {
            logger_1.sphinxLogger.info('adding badge table', logger_1.logging.DB);
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_badge (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      badge_id INTEGER,
      name TEXT,
      host TEXT,
      memo TEXT,
      type INTEGER,
      deleted BOOLEAN,
      asset TEXT,
      tenant INTEGER,
      amount BIGINT,
      icon TEXT,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            // sphinxLogger.error(['problem adding badge table:', e], logging.DB)
        }
        try {
            logger_1.sphinxLogger.info('adding tribe badge table', logger_1.logging.DB);
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_tribe_badge (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      badge_id INTEGER,
      chat_id INTEGER,
      reward_type INTEGER,
      reward_requirement INTEGER,
      deleted BOOLEAN,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            // sphinxLogger.error(['problem adding tribe badge table:', e], logging.DB)
        }
        addTableColumn('sphinx_chat_bots', 'hidden_commands');
        addTableColumn('sphinx_call_recording', 'retry', 'INTEGER');
        addTableColumn('sphinx_badge', 'reward_type', 'INTEGER');
        addTableColumn('sphinx_badge', 'reward_requirement', 'INTEGER');
        addTableColumn('sphinx_badge', 'active', 'BOOLEAN');
        addTableColumn('sphinx_tribe_badge', 'active', 'BOOLEAN');
        // id | Title | Desc | link | current_version_id | chatId | tenant | createdAt | updatedAt
        try {
            logger_1.sphinxLogger.info('adding recurring call table', logger_1.logging.DB);
            yield models_1.sequelize.query(`
    CREATE TABLE sphinx_recurring_calls (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      link TEXT,
      current_version_id TEXT,
      chat_id INTEGER,
      tenant INTEGER,
      deleted BOOLEAN,
      created_at DATETIME,
      updated_at DATETIME
    )`);
        }
        catch (e) {
            // sphinxLogger.error(['problem adding recurring calls table:', e], logging.DB)
        }
        addTableColumn(`sphinx_call_recording`, `version_id`, 'TEXT');
        addTableColumn('sphinx_messages', 'only_owner', 'BOOLEAN');
        addTableColumn('sphinx_chats', 'preview', 'TEXT');
        addTableColumn('sphinx_contacts', 'prune', 'INTEGER');
        addTableColumn('sphinx_messages', 'error_message', 'TEXT');
        addTableColumn('sphinx_messages', 'thread_uuid', 'TEXT');
        addTableColumn('sphinx_timers', 'msg_uuid', 'TEXT');
    });
}
exports.default = migrate;
function addTenant(tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield addTableColumn(tableName, 'tenant', 'BIGINT');
        try {
            yield models_1.sequelize.query(`update ${tableName} set tenant=1 where tenant IS NULL`);
        }
        catch (e) {
            // sphinxLogger.error(e, logging.DB)
        }
    });
}
function addTableColumn(table, column, type = 'TEXT') {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield models_1.sequelize.query(`alter table ${table} add ${column} ${type}`);
        }
        catch (e) {
            // sphinxLogger.error(['=> migrate failed', e], logging.DB)
        }
    });
}
//# sourceMappingURL=migrate.js.map