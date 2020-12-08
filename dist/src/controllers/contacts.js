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
const models_1 = require("../models");
const crypto = require("crypto");
const socket = require("../utils/socket");
const helpers = require("../helpers");
const jsonUtils = require("../utils/json");
const res_1 = require("../utils/res");
const password_1 = require("../utils/password");
const sequelize_1 = require("sequelize");
const constants_1 = require("../constants");
exports.getContacts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contacts = yield models_1.models.Contact.findAll({ where: { deleted: false }, raw: true });
    const invites = yield models_1.models.Invite.findAll({ raw: true });
    const chats = yield models_1.models.Chat.findAll({ where: { deleted: false }, raw: true });
    const subscriptions = yield models_1.models.Subscription.findAll({ raw: true });
    const pendingMembers = yield models_1.models.ChatMember.findAll({ where: {
            status: constants_1.default.chat_statuses.pending
        } });
    const contactsResponse = contacts.map(contact => {
        let contactJson = jsonUtils.contactToJson(contact);
        let invite = invites.find(invite => invite.contactId == contact.id);
        if (invite) {
            contactJson.invite = jsonUtils.inviteToJson(invite);
        }
        return contactJson;
    });
    const subsResponse = subscriptions.map(s => jsonUtils.subscriptionToJson(s, null));
    const chatsResponse = chats.map(chat => {
        const theChat = chat.dataValues || chat;
        if (!pendingMembers)
            return jsonUtils.chatToJson(theChat);
        const membs = pendingMembers.filter(m => m.chatId === chat.id) || [];
        theChat.pendingContactIds = membs.map(m => m.contactId);
        return jsonUtils.chatToJson(theChat);
    });
    res_1.success(res, {
        contacts: contactsResponse,
        chats: chatsResponse,
        subscriptions: subsResponse
    });
});
exports.generateToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> generateToken called', { body: req.body, params: req.params, query: req.query });
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true, authToken: null } });
    const pwd = password_1.default;
    if (process.env.USE_PASSWORD === 'true') {
        if (pwd !== req.query.pwd) {
            res_1.failure(res, 'Wrong Password');
            return;
        }
        else {
            console.log("PASSWORD ACCEPTED!");
        }
    }
    if (owner) {
        const hash = crypto.createHash('sha256').update(req.body['token']).digest('base64');
        console.log("req.params['token']", req.params['token']);
        console.log("hash", hash);
        owner.update({ authToken: hash });
        res_1.success(res, {});
    }
    else {
        res_1.failure(res, {});
    }
});
exports.updateContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> updateContact called', { body: req.body, params: req.params, query: req.query });
    let attrs = extractAttrs(req.body);
    const contact = yield models_1.models.Contact.findOne({ where: { id: req.params.id } });
    if (!contact) {
        return res_1.failure(res, 'no contact found');
    }
    const contactKeyChanged = attrs['contact_key'] && contact.contactKey !== attrs['contact_key'];
    const aliasChanged = attrs['alias'] && contact.alias !== attrs['alias'];
    const photoChanged = attrs['photo_url'] && contact.photoUrl !== attrs['photo_url'];
    // update contact
    const owner = yield contact.update(jsonUtils.jsonToContact(attrs));
    res_1.success(res, jsonUtils.contactToJson(owner));
    if (!contact.isOwner)
        return;
    if (!(attrs['contact_key'] || attrs['alias'] || attrs['photo_url'])) {
        return; // skip if not at least one of these
    }
    if (!(contactKeyChanged || aliasChanged || photoChanged)) {
        return;
    }
    // send updated owner info to others!
    const contactIds = yield models_1.models.Contact.findAll({ where: { deleted: false } })
        .filter(c => c.id !== 1 && c.publicKey).map(c => c.id);
    if (contactIds.length == 0)
        return;
    console.log("=> send contact_key to", contactIds);
    helpers.sendContactKeys({
        contactIds: contactIds,
        sender: owner,
        type: constants_1.default.message_types.contact_key,
    });
});
exports.exchangeKeys = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> exchangeKeys called', { body: req.body, params: req.params, query: req.query });
    const contact = yield models_1.models.Contact.findOne({ where: { id: req.params.id } });
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    res_1.success(res, jsonUtils.contactToJson(contact));
    helpers.sendContactKeys({
        contactIds: [contact.id],
        sender: owner,
        type: constants_1.default.message_types.contact_key,
    });
});
exports.createContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> createContact called', { body: req.body, params: req.params, query: req.query });
    let attrs = extractAttrs(req.body);
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    const existing = attrs['public_key'] && (yield models_1.models.Contact.findOne({ where: { publicKey: attrs['public_key'] } }));
    if (existing) {
        const updateObj = { fromGroup: false };
        if (attrs['alias'])
            updateObj.alias = attrs['alias'];
        yield existing.update(updateObj);
        return res_1.success(res, jsonUtils.contactToJson(existing));
    }
    if (attrs['public_key'].length > 66)
        attrs['public_key'] = attrs['public_key'].substring(0, 66);
    const createdContact = yield models_1.models.Contact.create(attrs);
    const contact = yield createdContact.update(jsonUtils.jsonToContact(attrs));
    res_1.success(res, jsonUtils.contactToJson(contact));
    helpers.sendContactKeys({
        contactIds: [contact.id],
        sender: owner,
        type: constants_1.default.message_types.contact_key,
    });
});
exports.deleteContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id || '0');
    if (!id || id === 1) {
        res_1.failure(res, 'Cannot delete self');
        return;
    }
    const contact = yield models_1.models.Contact.findOne({ where: { id } });
    if (!contact)
        return;
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    const tribesImAdminOf = yield models_1.models.Chat.findAll({ where: { ownerPubkey: owner.publicKey } });
    const tribesIdArray = tribesImAdminOf && tribesImAdminOf.length && tribesImAdminOf.map(t => t.id);
    let okToDelete = true;
    if (tribesIdArray && tribesIdArray.length) {
        const thisContactMembers = yield models_1.models.ChatMember.findAll({ where: { contactId: id, chatId: { [sequelize_1.Op.in]: tribesIdArray } } });
        if (thisContactMembers && thisContactMembers.length) {
            // IS A MEMBER! dont delete, instead just set from_group=true
            okToDelete = false;
            yield contact.update({ fromGroup: true });
        }
    }
    if (okToDelete) {
        yield contact.update({
            deleted: true,
            publicKey: '',
            photoUrl: '',
            alias: 'Unknown',
            contactKey: '',
        });
    }
    // find and destroy chat & messages
    const chats = yield models_1.models.Chat.findAll({ where: { deleted: false } });
    chats.map((chat) => __awaiter(void 0, void 0, void 0, function* () {
        if (chat.type === constants_1.default.chat_types.conversation) {
            const contactIds = JSON.parse(chat.contactIds);
            if (contactIds.includes(id)) {
                yield chat.update({
                    deleted: true,
                    uuid: '',
                    contactIds: '[]',
                    name: ''
                });
                yield models_1.models.Message.destroy({ where: { chatId: chat.id } });
            }
        }
    }));
    yield models_1.models.Invite.destroy({ where: { contactId: id } });
    yield models_1.models.Subscription.destroy({ where: { contactId: id } });
    res_1.success(res, {});
});
exports.receiveContactKey = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> received contact key', JSON.stringify(payload));
    const dat = payload.content || payload;
    const sender_pub_key = dat.sender.pub_key;
    const sender_contact_key = dat.sender.contact_key;
    const sender_alias = dat.sender.alias || 'Unknown';
    const sender_photo_url = dat.sender.photo_url;
    if (!sender_pub_key) {
        return console.log("no pubkey!");
    }
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    const sender = yield models_1.models.Contact.findOne({ where: { publicKey: sender_pub_key, status: constants_1.default.contact_statuses.confirmed } });
    let contactKeyChanged = false;
    console.log("ContACT KEY CHANGED?", contactKeyChanged);
    if (sender_contact_key && sender) {
        if (sender_contact_key !== sender.contactKey) {
            contactKeyChanged = true;
        }
        const objToUpdate = { contactKey: sender_contact_key };
        if (sender_alias)
            objToUpdate.alias = sender_alias;
        if (sender_photo_url)
            objToUpdate.photoUrl = sender_photo_url;
        yield sender.update(objToUpdate);
        socket.sendJson({
            type: 'contact',
            response: jsonUtils.contactToJson(sender)
        });
    }
    else {
        console.log("DID NOT FIND SENDER");
    }
    console.log("ContACT KEY CHANGED 2?", contactKeyChanged);
    if (contactKeyChanged) {
        helpers.sendContactKeys({
            contactPubKey: sender_pub_key,
            sender: owner,
            type: constants_1.default.message_types.contact_key_confirmation,
        });
    }
});
exports.receiveConfirmContactKey = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`=> confirm contact key for ${payload.sender && payload.sender.pub_key}`, JSON.stringify(payload));
    const dat = payload.content || payload;
    const sender_pub_key = dat.sender.pub_key;
    const sender_contact_key = dat.sender.contact_key;
    const sender_alias = dat.sender.alias || 'Unknown';
    const sender_photo_url = dat.sender.photo_url;
    if (!sender_pub_key) {
        return console.log("no pubkey!");
    }
    const sender = yield models_1.models.Contact.findOne({ where: { publicKey: sender_pub_key, status: constants_1.default.contact_statuses.confirmed } });
    if (sender_contact_key && sender) {
        const objToUpdate = { contactKey: sender_contact_key };
        if (sender_alias)
            objToUpdate.alias = sender_alias;
        if (sender_photo_url)
            objToUpdate.photoUrl = sender_photo_url;
        yield sender.update(objToUpdate);
        socket.sendJson({
            type: 'contact',
            response: jsonUtils.contactToJson(sender)
        });
    }
});
const extractAttrs = body => {
    let fields_to_update = ["public_key", "node_alias", "alias", "photo_url", "device_id", "status", "contact_key", "from_group", "private_photo", "notification_sound", "tip_amount"];
    let attrs = {};
    Object.keys(body).forEach(key => {
        if (fields_to_update.includes(key)) {
            attrs[key] = body[key];
        }
    });
    return attrs;
};
//# sourceMappingURL=contacts.js.map