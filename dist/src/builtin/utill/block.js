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
exports.addToBlockedList = exports.kickChatMember = void 0;
const constants_1 = require("../../constants");
const models_1 = require("../../models");
const network = require("../../network");
const timers = require("../../utils/timers");
function kickChatMember({ tribe, contactId, tenant, owner, }) {
    return __awaiter(this, void 0, void 0, function* () {
        // remove user from contactIds
        const contactIds = JSON.parse(tribe.contactIds || '[]');
        const newContactIds = contactIds.filter((cid) => cid !== contactId);
        yield tribe.update({ contactIds: JSON.stringify(newContactIds) });
        // remove from ChatMembers
        yield models_1.models.ChatMember.destroy({
            where: {
                chatId: tribe.id,
                contactId,
                tenant,
            },
        });
        //   Send message
        network.sendMessage({
            chat: Object.assign(Object.assign({}, tribe.dataValues), { contactIds: JSON.stringify([contactId]) }),
            sender: owner,
            message: {},
            type: constants_1.default.message_types.group_kick,
        });
        // delete all timers for this member
        timers.removeTimersByContactIdChatId(contactId, tribe.id, tenant);
    });
}
exports.kickChatMember = kickChatMember;
function addToBlockedList({ tribe, botPrefix, pubkey, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const bot = (yield models_1.models.ChatBot.findOne({
            where: { chatId: tribe.id, botPrefix, tenant: tribe.tenant },
        }));
        const blockedList = JSON.parse(bot.meta || '[]');
        if (!blockedList.includes(pubkey)) {
            blockedList.push(pubkey);
            yield bot.update({ meta: JSON.stringify(blockedList) });
        }
        return;
    });
}
exports.addToBlockedList = addToBlockedList;
//# sourceMappingURL=block.js.map