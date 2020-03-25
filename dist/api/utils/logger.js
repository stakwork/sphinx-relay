"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expressWinston = require("express-winston");
const winston = require("winston");
const moment = require("moment");
const tsFormat = (ts) => moment(ts).format('YYYY-MM-DD hh:mm:ss').trim();
const logger = expressWinston.logger({
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(winston.format.timestamp(), winston.format.colorize(), winston.format.printf(info => {
        return `-> ${tsFormat(info.timestamp)}: ${info.message}`;
    })),
    meta: false,
    // msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true,
    colorize: true,
    ignoreRoute: function (req, res) {
        if (req.path.startsWith('/json'))
            return true; // debugger
        return false;
    } // optional: allows to skip some log messages based on request and/or response
});
exports.default = logger;
//# sourceMappingURL=logger.js.map