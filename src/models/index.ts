// parse BIGINTs to number
require('pg').defaults.parseInt8 = true
import { Sequelize } from 'sequelize-typescript';
import * as path from 'path'
import Chat from './sql/chat'
import Contact from './sql/contact'
import Invite from './sql/invite'
import Message from './sql/message'
import Subscription from './sql/subscription'
import MediaKey from './sql/mediaKey'
import ChatMember from './sql/chatMember'
import Timer from './sql/timer'
import Bot from './sql/bot'
import ChatBot from './sql/chatBot'
import BotMember from './sql/botMember'
import Accounting from './sql/accounting'
import * as minimist from 'minimist';
import { loadConfig } from "../utils/config";
import { isProxy } from '../utils/proxy';

const argv = minimist(process.argv.slice(2));

const configFile = argv.db ? argv.db : path.join(__dirname, '../../config/config.json')

const env = process.env.NODE_ENV || 'development';
const config = require(configFile)[env]

const appConfig = loadConfig()

const opts = {
  ...config,
  logging: appConfig.sql_log === 'true' ? console.log : false,
  models: [Chat, Contact, Invite, Message, Subscription, MediaKey, ChatMember, Timer, Bot, ChatBot, BotMember, Accounting]
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

import {Contact as ContactType, Chat as ChatType, Message as MessageType} from './ts'

export {
  sequelize,
  models,
  ContactType as Contact,
  ChatType as Chat,
  MessageType as Message,
}
