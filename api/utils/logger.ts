import * as expressWinston from 'express-winston'
import * as winston from 'winston'
import * as moment from 'moment'

const tsFormat = (ts) => moment(ts).format('YYYY-MM-DD hh:mm:ss').trim();

const logger = expressWinston.logger({
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(info=>{
          return `-> ${tsFormat(info.timestamp)}: ${info.message}`
      })
    ),
    meta: false, // optional: control whether you want to log the meta data about the request (default to true)
    // msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) { 
      if(req.path.startsWith('/json')) return true // debugger
      return false; 
    } // optional: allows to skip some log messages based on request and/or response
})

export default logger