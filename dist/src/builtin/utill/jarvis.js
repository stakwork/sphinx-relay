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
exports.updateLink = void 0;
const _1 = require("./");
const logger_1 = require("../../utils/logger");
function updateLink({ botPrefix, command, botMessage, tribe, url, isAdmin, botName, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bot = yield (0, _1.findBot)({ botPrefix, tribe });
            console.log(bot);
            let meta = JSON.parse(bot.meta || `{}`);
            meta.url = url;
            yield bot.update({ meta: JSON.stringify(meta) });
            const secondBot = yield (0, _1.findBot)({ botPrefix, tribe });
            console.log(secondBot.dataValues);
            return yield (0, _1.botResponse)(botName, 'Jarvis link updated successfullt', botPrefix, tribe.id, botMessage, command);
        }
        catch (error) {
            logger_1.sphinxLogger.error([`JARVIS BOT ERROR ${error}`, logger_1.logging.Bots]);
            return yield (0, _1.botResponse)(botName, 'Error updating link', botPrefix, tribe.id, botMessage, command);
        }
    });
}
exports.updateLink = updateLink;
//# sourceMappingURL=jarvis.js.map