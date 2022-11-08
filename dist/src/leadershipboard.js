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
exports.leadershipBoardInterval = void 0;
const models_1 = require("./models");
const config_1 = require("./utils/config");
const tribes_1 = require("./utils/tribes");
const node_fetch_1 = require("node-fetch");
const https = require("https");
const tribeAgent = new https.Agent({
    keepAlive: true,
});
const config = (0, config_1.loadConfig)();
function updateLeadershipBoard() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const contacts = (yield models_1.models.Contact.findAll({
                where: { isOwner: true },
            }));
            for (let i = 0; i < contacts.length; i++) {
                const contact = contacts[i];
                const tribes = (yield models_1.models.Chat.findAll({
                    where: { ownerPubkey: contact.publicKey },
                }));
                for (let j = 0; j < tribes.length; j++) {
                    const tribe = tribes[j];
                    const tribeMembers = (yield models_1.models.ChatMember.findAll({
                        where: { chatId: tribe.id },
                    }));
                    const leadershipRecord = parseLeaderRecord(tribeMembers);
                    if (leadershipRecord.length > 0) {
                        const token = yield (0, tribes_1.genSignedTimestamp)(contact.publicKey);
                        let protocol = 'https';
                        if (config.tribes_insecure)
                            protocol = 'http';
                        yield (0, node_fetch_1.default)(`${protocol}://${tribe.host}/leaderboard/${tribe.uuid}?token=${token}`, {
                            agent: config.tribes_insecure ? undefined : tribeAgent,
                            method: 'POST',
                            body: JSON.stringify(leadershipRecord),
                            headers: { 'Content-Type': 'application/json' },
                        });
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}
function parseLeaderRecord(members) {
    const leaderShipRecord = [];
    members.forEach((member) => {
        if (member.lastAlias) {
            leaderShipRecord.push({
                alias: member.lastAlias,
                spent: member.totalSpent,
                earned: member.totalEarned,
            });
        }
    });
    return leaderShipRecord;
}
function leadershipBoardInterval(ms) {
    setInterval(updateLeadershipBoard, ms);
}
exports.leadershipBoardInterval = leadershipBoardInterval;
//# sourceMappingURL=leadershipboard.js.map