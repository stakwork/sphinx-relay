// parse BIGINTs to number
require('pg').defaults.parseInt8 = true
import { Sequelize } from 'sequelize-typescript';
import * as path from 'path'
import Chat from './ts/chat'
import Contact from './ts/contact'
import Invite from './ts/invite'
import Message from './ts/message'
import Subscription from './ts/subscription'
import MediaKey from './ts/mediaKey'
import ChatMember from './ts/chatMember'
import Timer from './ts/timer'
import Bot from './ts/bot'
import ChatBot from './ts/chatBot'
import BotMember from './ts/botMember'
import Accounting from './ts/accounting'
import * as minimist from 'minimist';
import { loadConfig } from "../utils/config";

const argv = minimist(process.argv.slice(2));

const configFile = argv.db ? argv.db : path.join(__dirname, '../../config/config.json')

const env = process.env.NODE_ENV || 'development';
const config = require(configFile)[env]

const appConfig = loadConfig()

const sequelize = new Sequelize({
  ...config,
  logging: appConfig.sql_log === 'true' ? console.log : false,
  models: [Chat, Contact, Invite, Message, Subscription, MediaKey, ChatMember, Timer, Bot, ChatBot, BotMember, Accounting]
})
const models = sequelize.models

export {
  sequelize,
  models,
}
