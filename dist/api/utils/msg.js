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
const ldat_1 = require("./ldat");
function addInRemoteText(full, contactId) {
    const m = full && full.message;
    if (!(m && m.content))
        return full;
    if (!(typeof m.content === 'object'))
        return full;
    return fillmsg(full, { content: m.content[contactId + ''] });
}
function removeRecipientFromChatMembers(full, destkey) {
    const c = full && full.chat;
    if (!(c && c.members))
        return full;
    if (!(typeof c.members === 'object'))
        return full;
    const members = Object.assign({}, c.members);
    if (members[destkey])
        delete members[destkey];
    return fillchatmsg(full, { members });
}
function removeAllNonAdminMembersIfTribe(full, destkey) {
    return full;
    // const c = full && full.chat
    // if (!(c && c.members)) return full
    // if (!(typeof c.members==='object')) return full
    // const members = {...c.members}
    // if(members[destkey]) delete members[destkey]
    // return fillchatmsg(full, {members})
}
function addInMediaKey(full, contactId) {
    const m = full && full.message;
    if (!(m && m.mediaKey))
        return full;
    if (!(m && m.mediaTerms))
        return full;
    if (!(typeof m.mediaKey === 'object'))
        return full;
    const mediaKey = m.mediaTerms.skipSigning ? '' : m.mediaKey[contactId + ''];
    return fillmsg(full, { mediaKey });
}
// add the token if its free, but if a price just the base64(host).muid
function finishTermsAndReceipt(full, destkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const m = full && full.message;
        if (!(m && m.mediaTerms))
            return full;
        const t = m.mediaTerms;
        const meta = t.meta || {};
        t.ttl = t.ttl || 31536000;
        meta.ttl = t.ttl;
        const mediaToken = yield ldat_1.tokenFromTerms({
            host: t.host || '',
            muid: t.muid,
            ttl: t.skipSigning ? 0 : t.ttl,
            pubkey: t.skipSigning ? '' : destkey,
            meta
        });
        const fullmsg = fillmsg(full, { mediaToken });
        delete fullmsg.message.mediaTerms;
        return fullmsg;
    });
}
function personalizeMessage(m, contactId, destkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const cloned = JSON.parse(JSON.stringify(m));
        const msg = addInRemoteText(cloned, contactId);
        const cleanMsg = removeRecipientFromChatMembers(msg, destkey);
        const cleanerMsg = removeAllNonAdminMembersIfTribe(cleanMsg, destkey);
        const msgWithMediaKey = addInMediaKey(cleanerMsg, contactId);
        const finalMsg = yield finishTermsAndReceipt(msgWithMediaKey, destkey);
        return finalMsg;
    });
}
exports.personalizeMessage = personalizeMessage;
function fillmsg(full, props) {
    return Object.assign(Object.assign({}, full), { message: Object.assign(Object.assign({}, full.message), props) });
}
function fillchatmsg(full, props) {
    return Object.assign(Object.assign({}, full), { chat: Object.assign(Object.assign({}, full.chat), props) });
}
//# sourceMappingURL=msg.js.map