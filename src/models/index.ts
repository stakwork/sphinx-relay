// parse BIGINTs to number
import * as pg from 'pg'
pg.defaults.parseInt8 = true
import { Sequelize } from 'sequelize-typescript'
import * as path from 'path'
import Chat, { ChatRecord } from './sql/chat'
import Contact, { ContactRecord } from './sql/contact'
import Invite, { InviteRecord } from './sql/invite'
import Message, { MessageRecord } from './sql/message'
import Subscription from './sql/subscription'
import MediaKey, { MediaKeyRecord } from './sql/mediaKey'
import ChatMember, { ChatMemberRecord } from './sql/chatMember'
import Timer from './sql/timer'
import Bot, { BotRecord } from './sql/bot'
import ChatBot, { ChatBotRecord } from './sql/chatBot'
import BotMember, { BotMemberRecord } from './sql/botMember'
import Accounting, { AccountingRecord } from './sql/accounting'
import Lsat from './sql/lsat'
import RequestsTransportTokens from './sql/requestsTransportTokens'
import * as minimist from 'minimist'
import { loadConfig } from '../utils/config'
import { isProxy } from '../utils/proxy'
import { readFileSync } from 'fs'
import ActionHistory, { ActionHistoryRecord } from './sql/actionHistory'
import CallRecording, { CallRecordingRecord } from './sql/callRecording'
import GraphSubscription, {
  GraphSubscriptionRecord,
} from './sql/graphSubscription'

const argv = minimist(process.argv.slice(2))

const configFile = argv.db
  ? path.resolve(process.cwd(), argv.db)
  : path.join(__dirname, '../../config/config.json')

const env = process.env.NODE_ENV || 'development'

let config: any
const dialect = process.env.DB_DIALECT
const storage = process.env.DB_STORAGE
if (dialect && storage) {
  config = {
    dialect,
    storage,
  }
} else {
  config = JSON.parse(readFileSync(configFile).toString())[env]
}

const appConfig = loadConfig()

const opts = {
  ...config,
  logging: appConfig.sql_log === 'true' ? console.log : false,
  models: [
    Chat,
    Contact,
    Invite,
    Message,
    Subscription,
    MediaKey,
    ChatMember,
    Timer,
    Bot,
    ChatBot,
    BotMember,
    Accounting,
    Lsat,
    RequestsTransportTokens,
    ActionHistory,
    CallRecording,
    GraphSubscription,
  ],
}
if (isProxy()) {
  opts.pool = {
    max: 7,
    min: 2,
    acquire: 30000,
    idle: 10000,
  }
}

const sequelize = new Sequelize(opts)
const models = sequelize.models

export {
  sequelize,
  models,
  Contact,
  ContactRecord,
  Chat,
  ChatRecord,
  Message,
  MessageRecord,
  InviteRecord,
  MediaKeyRecord,
  ChatMember,
  ChatMemberRecord,
  BotRecord,
  ChatBotRecord,
  BotMemberRecord,
  Invite,
  Subscription,
  ChatBot,
  Timer,
  Bot,
  Accounting,
  AccountingRecord,
  MediaKey,
  Lsat,
  BotMember,
  RequestsTransportTokens,
  ActionHistory,
  ActionHistoryRecord,
  CallRecording,
  CallRecordingRecord,
  GraphSubscription,
  GraphSubscriptionRecord,
}
