import * as expressWinston from 'express-winston'
import * as winston from 'winston'
import * as moment from 'moment'
import { loadConfig } from './config'
import * as blgr from 'blgr'
const blgrLogger = new blgr('debug')

const config = loadConfig()

const tsFormat = (ts) => moment(ts).format('YYYY-MM-DD HH:mm:ss').trim()

const logger = expressWinston.logger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf((info) => {
      return `-> ${tsFormat(info.timestamp)}: ${info.message}`
    })
  ),
  meta: false, // optional: control whether you want to log the meta data about the request (default to true)
  // msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  ignoreRoute: function (req, res) {
    if (req.path.startsWith('/json')) return true // debugger
    return false
  }, // optional: allows to skip some log messages based on request and/or response
})

export default logger

interface Logging {
  Express: string
  Lightning: string
  Meme: string
  Tribes: string
  Notification: string
  Network: string
  DB: string
  Proxy: string
  Lsat: string
}

const logging: Logging = {
  Express: 'EXPRESS',
  Lightning: 'LIGHTNING',
  Meme: 'MEME',
  Tribes: 'TRIBES',
  Notification: 'NOTIFICATION',
  Network: 'NETWORK',
  DB: 'DB',
  Proxy: 'PROXY',
  Lsat: 'LSAT',
}

async function sphinxLoggerInfo(
  message: any | Array<any>,
  loggingType: string = 'MISC'
) {
  if (
    (config.logging && config.logging.includes(loggingType)) ||
    loggingType == 'MISC'
  ) {
    await blgrLogger.open()
    const date = new Date(Date.now()).toUTCString()
    blgrLogger.info(
      date,
      '[' + loggingType + ']',
      ...(Array.isArray(message) ? message : [message])
    )
  }
}

async function sphinxLoggerError(
  message: any | Array<any>,
  loggingType: string = 'MISC'
) {
  if (
    (config.logging && config.logging.includes(loggingType)) ||
    loggingType == 'MISC'
  ) {
    await blgrLogger.open()
    const date = new Date(Date.now()).toUTCString()
    blgrLogger.error(
      date,
      '[' + loggingType + ']',
      ...(Array.isArray(message) ? message : [message])
    )
  }
}

const sphinxLogger = {
  info: sphinxLoggerInfo,
  error: sphinxLoggerError,
}
export { logging, sphinxLogger }
