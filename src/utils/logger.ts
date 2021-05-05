import * as expressWinston from 'express-winston'
import * as winston from 'winston'
import * as moment from 'moment'
import { loadConfig } from './config'

const config = loadConfig()

const tsFormat = (ts) => moment(ts).format('YYYY-MM-DD HH:mm:ss').trim();

const logger = expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(info => {
      return `-> ${tsFormat(info.timestamp)}: ${info.message}`
    })
  ),
  meta: false, // optional: control whether you want to log the meta data about the request (default to true)
  // msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  ignoreRoute: function (req, res) {
    if (req.path.startsWith('/json')) return true // debugger
    return false;
  } // optional: allows to skip some log messages based on request and/or response
})

export default logger

interface Logging {
  Express: boolean,
  Lightning: boolean,
  Meme: boolean,
  Tribes: boolean,
  Notification: boolean,
  Network: boolean,
  DB: boolean,
  Proxy: boolean
}

const logging:Logging = {
  Express: config.logging && config.logging.includes('EXPRESS'),
  Lightning: config.logging && config.logging.includes('LIGHTNING'),
  Meme: config.logging && config.logging.includes('MEME'),
  Tribes: config.logging && config.logging.includes('TRIBES'),
  Notification: config.logging && config.logging.includes('NOTIFICATION'),
  Network: config.logging && config.logging.includes('NETWORK'),
  DB: config.logging && config.logging.includes('DB'),
  Proxy: config.logging && config.logging.includes('PROXY'),
}

export {logging}