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
exports.sphinxLogger = exports.logging = void 0;
const expressWinston = require("express-winston");
const winston = require("winston");
const moment = require("moment");
const config_1 = require("./config");
const blgr = require("blgr");
const config = config_1.loadConfig();
const blgrLogger = new blgr(config.logging_level);
const tsFormat = (ts) => moment(ts).format('YYYY-MM-DD HH:mm:ss').trim();
const logger = expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.timestamp(), winston.format.colorize(), winston.format.printf((info) => {
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
    }, // optional: allows to skip some log messages based on request and/or response
});
exports.default = logger;
const logging = {
    Express: 'EXPRESS',
    Lightning: 'LIGHTNING',
    Meme: 'MEME',
    Tribes: 'TRIBES',
    Notification: 'NOTIFICATION',
    Network: 'NETWORK',
    DB: 'DB',
    Proxy: 'PROXY',
    Lsat: 'LSAT',
    Greenlight: 'GREENLIGHT',
    SSL: 'SSL',
    Bots: 'BOTS',
};
exports.logging = logging;
function sphinxLoggerBase(message, loggingType = 'MISC', level) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((config.logging && config.logging.includes(loggingType)) ||
            loggingType == 'MISC') {
            yield blgrLogger.open();
            const [date, time] = new Date(Date.now())
                .toISOString()
                .split('.')[0]
                .split('T');
            const dateArr = date.split('-');
            dateArr.push(dateArr.shift().substring(2));
            blgrLogger[level](`${dateArr.join('-')}T${time}`, '[' + loggingType + ']', ...(Array.isArray(message) ? message : [message]));
        }
    });
}
function sphinxLoggerNone(message, loggingType) {
    return __awaiter(this, void 0, void 0, function* () {
        sphinxLoggerBase(message, loggingType, 'none');
    });
}
function sphinxLoggerError(message, loggingType) {
    return __awaiter(this, void 0, void 0, function* () {
        sphinxLoggerBase(message, loggingType, 'error');
    });
}
function sphinxLoggerWarning(message, loggingType) {
    return __awaiter(this, void 0, void 0, function* () {
        sphinxLoggerBase(message, loggingType, 'warning');
    });
}
function sphinxLoggerInfo(message, loggingType) {
    return __awaiter(this, void 0, void 0, function* () {
        sphinxLoggerBase(message, loggingType, 'info');
    });
}
function sphinxLoggerDebug(message, loggingType) {
    return __awaiter(this, void 0, void 0, function* () {
        sphinxLoggerBase(message, loggingType, 'debug');
    });
}
function sphinxLoggerSpam(message, loggingType) {
    return __awaiter(this, void 0, void 0, function* () {
        sphinxLoggerBase(message, loggingType, 'spam');
    });
}
const sphinxLogger = {
    none: sphinxLoggerNone,
    error: sphinxLoggerError,
    warning: sphinxLoggerWarning,
    info: sphinxLoggerInfo,
    debug: sphinxLoggerDebug,
    spam: sphinxLoggerSpam,
};
exports.sphinxLogger = sphinxLogger;
//# sourceMappingURL=logger.js.map