import { sequelize } from '../models'

export default async function migrate() {

  try {
    await sequelize.query(`
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
    )`)
  } catch (e) { }

  addTableColumn('sphinx_accountings', 'funding_txid')

  addTableColumn('sphinx_accountings', 'onchain_txid')
  addTableColumn('sphinx_accountings', 'commit_fee', 'BIGINT')
  addTableColumn('sphinx_accountings', 'local_reserve', 'BIGINT')
  addTableColumn('sphinx_accountings', 'remote_reserve', 'BIGINT')
  addTableColumn('sphinx_accountings', 'extra_amount', 'BIGINT')

  addTableColumn('sphinx_chat_members', 'last_alias')

  addTableColumn('sphinx_chats', 'my_photo_url')
  addTableColumn('sphinx_chats', 'my_alias')

  addTableColumn('sphinx_messages', 'sender_pic')

  addTableColumn('sphinx_messages', 'network_type', 'INTEGER')

  addTableColumn('sphinx_chats', 'meta')

  addTableColumn('sphinx_contacts', 'tip_amount', 'BIGINT')

  addTableColumn('sphinx_contacts', 'last_active', 'DATETIME')

  try {
    await sequelize.query(`
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
    )`)
  } catch (e) { }

  try {
    await sequelize.query(`CREATE UNIQUE INDEX chat_bot_index ON sphinx_chat_bots(chat_id, bot_uuid);`)
  } catch (e) { }

  addTableColumn('sphinx_bots', 'webhook')
  addTableColumn('sphinx_bots', 'uuid')
  addTableColumn('sphinx_bots', 'price_per_use', 'INT')

  try {
    await sequelize.query(`
    CREATE TABLE sphinx_bot_members (
      id BIGINT NOT NULL PRIMARY KEY,
      member_pubkey TEXT,
      tribe_uuid TEXT,
      msg_count BIGINT,
      created_at DATETIME,
      updated_at DATETIME
    )`)
  } catch (e) { }

  addTableColumn('sphinx_bot_members', 'bot_id')

  //////////

  try {
    await sequelize.query(`
    CREATE TABLE sphinx_bots (
      id TEXT NOT NULL PRIMARY KEY,
      name TEXT,
      secret TEXT,
      created_at DATETIME,
      updated_at DATETIME
    )`)
  } catch (e) { }

  addTableColumn('sphinx_chats', 'app_url')
  addTableColumn('sphinx_chats', 'feed_url')

  try {
    await sequelize.query(`CREATE UNIQUE INDEX chat_member_index ON sphinx_chat_members(chat_id, contact_id);`)
  } catch (e) { }

  addTableColumn('sphinx_chats', 'private', 'BOOLEAN')
  addTableColumn('sphinx_chats', 'unlisted', 'BOOLEAN')
  addTableColumn('sphinx_chat_members', 'status', 'BIGINT')

  addTableColumn('sphinx_chats', 'seen', 'BOOLEAN')

  try {
    await sequelize.query(`CREATE INDEX idx_messages_sender ON sphinx_messages (sender);`)
  } catch (e) { }

  addTableColumn('sphinx_contacts', 'notification_sound')
  addTableColumn('sphinx_contacts', 'from_group', 'BOOLEAN')
  addTableColumn('sphinx_contacts', 'private_photo', 'BOOLEAN')

  addTableColumn('sphinx_chats', 'escrow_amount', 'BIGINT')
  addTableColumn('sphinx_chats', 'escrow_millis', 'BIGINT')

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

}

async function addTableColumn(table: string, column: string, type = 'TEXT') {
  try {
    await sequelize.query(`alter table ${table} add ${column} ${type}`)
  } catch (e) {
    //console.log('=> migrate failed',e)
  }
}