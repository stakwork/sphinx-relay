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
exports.removePubkeyFromSpam = exports.listAllPubkeys = exports.addPubkeyToSpam = void 0;
const models_1 = require("../../models");
const index_1 = require("./index");
const logger_1 = require("../../utils/logger");
function addPubkeyToSpam(arrMsg, botPrefix, botName, tribe, msgObject) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = arrMsg[1];
        try {
            if (arrMsg.length !== 3) {
                yield (0, index_1.botResponse)(botName, 'Invalid commad to add to Spam List', botPrefix, tribe.id, msgObject, cmd);
                return;
            }
            const bot = yield (0, index_1.findBot)({ botPrefix, tribe });
            const pubkey = arrMsg[2];
            let exist = false;
            let meta = JSON.parse(bot.meta || `{}`);
            if (meta.pubkeys && meta.pubkeys.length > 0) {
                for (let i = 0; i < meta.pubkeys.length; i++) {
                    if (meta.pubkeys[i].pubkey === pubkey) {
                        exist = true;
                        break;
                    }
                }
            }
            if (exist) {
                yield (0, index_1.botResponse)(botName, 'Pubkey already exist on Spam_Gone list', botPrefix, tribe.id, msgObject, cmd);
                return;
            }
            const contact = (yield models_1.models.Contact.findOne({
                where: { publicKey: pubkey, tenant: tribe.tenant },
            }));
            if (!contact) {
                yield (0, index_1.botResponse)(botName, 'You cannot add this user to your spam list, because they are not on your contact list', botPrefix, tribe.id, msgObject, cmd);
                return;
            }
            const pubkeys = meta.pubkeys && meta.pubkeys.length > 0 ? [...meta.pubkeys] : [];
            pubkeys.push({ pubkey, alias: contact.alias });
            meta.pubkeys = [...pubkeys];
            yield bot.update({ meta: JSON.stringify(meta) });
            yield (0, index_1.botResponse)(botName, 'Pubkey added to list successfully', botPrefix, tribe.id, msgObject, cmd);
            return;
        }
        catch (error) {
            logger_1.sphinxLogger.error(`Error adding to spam_gone bot: ${error}`, logger_1.logging.Bots);
            yield (0, index_1.botResponse)(botName, error.message || 'Error occured while adding pubkey to list', botPrefix, tribe.id, msgObject, cmd);
            return;
        }
    });
}
exports.addPubkeyToSpam = addPubkeyToSpam;
function listAllPubkeys(arrMsg, botPrefix, botName, tribe, msgObject) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = arrMsg[1];
        try {
            if (arrMsg.length !== 2) {
                yield (0, index_1.botResponse)(botName, 'Invalid commad to fetch Spam List', botPrefix, tribe.id, msgObject, cmd);
                return;
            }
            const bot = yield (0, index_1.findBot)({ botPrefix, tribe });
            let meta = JSON.parse(bot.meta || `{}`);
            if (!meta.pubkeys || meta.pubkeys.length < 1) {
                yield (0, index_1.botResponse)(botName, 'No pubkey on the Spam_Gone list currently', botPrefix, tribe.id, msgObject, cmd);
                return;
            }
            let pubkeyMessage = '<p>Public keys on Spam_Gone:</p>';
            for (let i = 0; i < meta.pubkeys.length; i++) {
                pubkeyMessage = `${pubkeyMessage}<p>${i + 1}. ${meta.pubkeys[i].alias} (${meta.pubkeys[i].pubkey})</p>`;
            }
            yield (0, index_1.botResponse)(botName, pubkeyMessage, botPrefix, tribe.id, msgObject, cmd);
            return;
        }
        catch (error) {
            logger_1.sphinxLogger.error(`Error listing to spam_gone bot: ${error}`, logger_1.logging.Bots);
            yield (0, index_1.botResponse)(botName, error.message || 'Error occured while fetching spam_gone list', botPrefix, tribe.id, msgObject, cmd);
            return;
        }
    });
}
exports.listAllPubkeys = listAllPubkeys;
function removePubkeyFromSpam(arrMsg, botPrefix, botName, tribe, msgObject) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = arrMsg[1];
        try {
            if (arrMsg.length !== 3) {
                yield (0, index_1.botResponse)(botName, 'Invalid commad to remove from Spam List', botPrefix, tribe.id, msgObject, cmd);
                return;
            }
            const bot = yield (0, index_1.findBot)({ botPrefix, tribe });
            let meta = JSON.parse(bot.meta || `{}`);
            const pubkey = arrMsg[2];
            let pubkeyIndex = null;
            let exist = false;
            if (meta.pubkeys && meta.pubkeys.length > 0) {
                for (let i = 0; i < meta.pubkeys.length; i++) {
                    if (meta.pubkeys[i].pubkey === pubkey) {
                        exist = true;
                        pubkeyIndex = i;
                        break;
                    }
                }
                if (exist && pubkeyIndex !== null) {
                    meta.pubkeys.splice(pubkeyIndex, 1);
                    yield bot.update({ meta: JSON.stringify(meta) });
                    yield (0, index_1.botResponse)(botName, 'Pubkey successfully removed from Spam_Gone list', botPrefix, tribe.id, msgObject, cmd);
                    return;
                }
                else {
                    yield (0, index_1.botResponse)(botName, 'This pubkey does not exit on Spam_Gone list', botPrefix, tribe.id, msgObject, cmd);
                    return;
                }
            }
            else {
                yield (0, index_1.botResponse)(botName, 'No pubkey exist on Spam_Gone', botPrefix, tribe.id, msgObject, cmd);
                return;
            }
        }
        catch (error) {
            logger_1.sphinxLogger.error(`Error removing pubkey from spam_gone bot: ${error}`, logger_1.logging.Bots);
            yield (0, index_1.botResponse)(botName, error.message || 'Error occured while removing pubkey from spam_gone', botPrefix, tribe.id, msgObject, cmd);
            return;
        }
    });
}
exports.removePubkeyFromSpam = removePubkeyFromSpam;
//# sourceMappingURL=spamGone.js.map