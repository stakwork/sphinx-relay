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
exports.getLatestContacts = exports.receiveConfirmContactKey = exports.receiveContactKey = exports.deleteContact = exports.createContact = exports.exchangeKeys = exports.updateContact = exports.generateToken = exports.generateOwnerWithExternalSigner = exports.getContactsForChat = exports.getContacts = void 0;
const models_1 = require("../models");
const crypto = require("crypto");
const socket = require("../utils/socket");
const helpers = require("../helpers");
const jsonUtils = require("../utils/json");
const res_1 = require("../utils/res");
const password_1 = require("../utils/password");
const sequelize_1 = require("sequelize");
const constants_1 = require("../constants");
const tribes = require("../utils/tribes");
const network = require("../network");
const proxy_1 = require("../utils/proxy");
const logger_1 = require("../utils/logger");
const moment = require("moment");
const getContacts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, 'no owner');
    const tenant = req.owner.id;
    const dontIncludeFromGroup = req.query.from_group && req.query.from_group === 'false';
    const includeUnmet = req.query.unmet && req.query.unmet === 'include';
    const where = { deleted: false, tenant };
    if (dontIncludeFromGroup) {
        where.fromGroup = { [sequelize_1.Op.or]: [false, null] };
    }
    if (!includeUnmet) {
        // this is the default
        where.unmet = { [sequelize_1.Op.or]: [false, null] };
    }
    const contacts = yield models_1.models.Contact.findAll({
        where,
        raw: true,
    });
    const invites = yield models_1.models.Invite.findAll({ raw: true, where: { tenant } });
    const chats = yield models_1.models.Chat.findAll({
        where: { deleted: false, tenant },
        raw: true,
    });
    const subscriptions = yield models_1.models.Subscription.findAll({
        raw: true,
        where: { tenant },
    });
    const pendingMembers = yield models_1.models.ChatMember.findAll({
        where: {
            status: constants_1.default.chat_statuses.pending,
            tenant,
        },
    });
    const contactsResponse = contacts.map((contact) => {
        let contactJson = jsonUtils.contactToJson(contact);
        let invite = invites.find((invite) => invite.contactId == contact.id);
        if (invite) {
            contactJson.invite = jsonUtils.inviteToJson(invite);
        }
        return contactJson;
    });
    const subsResponse = subscriptions.map((s) => jsonUtils.subscriptionToJson(s, null));
    const chatsResponse = chats.map((chat) => {
        const theChat = chat.dataValues || chat;
        if (!pendingMembers)
            return jsonUtils.chatToJson(theChat);
        const membs = pendingMembers.filter((m) => m.chatId === chat.id) || [];
        theChat.pendingContactIds = membs.map((m) => m.contactId);
        return jsonUtils.chatToJson(theChat);
    });
    res_1.success(res, {
        contacts: contactsResponse,
        chats: chatsResponse,
        subscriptions: subsResponse,
    });
});
exports.getContacts = getContacts;
const getContactsForChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chat_id = parseInt(req.params.chat_id);
    if (!chat_id)
        return res_1.failure(res, 'no chat id');
    if (!req.owner)
        return res_1.failure(res, 'no owner');
    const tenant = req.owner.id;
    const chat = yield models_1.models.Chat.findOne({
        where: { id: chat_id, tenant },
    });
    if (!chat)
        return res_1.failure(res, 'chat not found');
    let contactIDs;
    try {
        contactIDs = JSON.parse(chat.contactIds || '[]');
    }
    catch (e) {
        return res_1.failure(res, 'no contact ids');
    }
    const pendingMembers = yield models_1.models.ChatMember.findAll({
        where: {
            status: constants_1.default.chat_statuses.pending,
            chatId: chat_id,
            tenant,
        },
    });
    if (!contactIDs || !contactIDs.length)
        return res_1.failure(res, 'no contact ids length');
    const limit = (req.query.limit && parseInt(req.query.limit)) || 1000;
    const offset = (req.query.offset && parseInt(req.query.offset)) || 0;
    const contacts = yield models_1.models.Contact.findAll({
        where: { id: { [sequelize_1.Op.in]: contactIDs }, tenant },
        limit,
        offset,
        order: [['alias', 'asc']],
    });
    if (!contacts)
        return res_1.failure(res, 'no contacts found');
    const contactsRet = contacts.map((c) => jsonUtils.contactToJson(c));
    let finalContacts = contactsRet;
    if (offset === 0) {
        const pendingContactIDs = (pendingMembers || []).map((cm) => cm.contactId);
        const pendingContacts = yield models_1.models.Contact.findAll({
            where: { id: { [sequelize_1.Op.in]: pendingContactIDs }, tenant },
            order: [['alias', 'asc']],
        });
        if (pendingContacts) {
            const pendingContactsRet = pendingContacts.map((c) => {
                const ctc = c.dataValues;
                ctc.pending = true;
                return jsonUtils.contactToJson(ctc);
            });
            finalContacts = pendingContactsRet.concat(contactsRet);
        }
    }
    res_1.success(res, { contacts: finalContacts });
});
exports.getContactsForChat = getContactsForChat;
function generateOwnerWithExternalSigner(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!proxy_1.isProxy()) {
            return res_1.failure(res, 'only proxy');
        }
        const { pubkey, sig } = req.body;
        const where = { isOwner: true, publicKey: pubkey };
        const owner = yield models_1.models.Contact.findOne({ where });
        if (owner) {
            return res_1.failure(res, 'owner already exists');
        }
        const generated = yield proxy_1.generateNewExternalUser(pubkey, sig);
        if (!generated) {
            return res_1.failure(res, 'generate failed');
        }
        const contact = {
            publicKey: generated.publicKey,
            routeHint: generated.routeHint,
            isOwner: true,
            authToken: null,
        };
        const created = yield models_1.models.Contact.create(contact);
        // set tenant to self!
        created.update({ tenant: created.id });
        res_1.success(res, { id: (created && created.id) || 0 });
    });
}
exports.generateOwnerWithExternalSigner = generateOwnerWithExternalSigner;
const generateToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('=> generateToken called', {
        body: req.body,
        params: req.params,
        query: req.query,
    });
    const where = { isOwner: true };
    const pubkey = req.body['pubkey'];
    if (proxy_1.isProxy()) {
        if (!pubkey) {
            return res_1.failure(res, 'no pubkey');
        }
        where.publicKey = pubkey;
    }
    const owner = yield models_1.models.Contact.findOne({ where });
    if (!owner) {
        return res_1.failure(res, 'no owner');
    }
    const pwd = password_1.default;
    if (process.env.USE_PASSWORD === 'true') {
        if (pwd !== req.query.pwd) {
            res_1.failure(res, 'Wrong Password');
            return;
        }
        else {
            console.log('PASSWORD ACCEPTED!');
        }
    }
    const token = req.body['token'];
    if (!token) {
        return res_1.failure(res, 'no token in body');
    }
    const hash = crypto.createHash('sha256').update(token).digest('base64');
    if (owner.authToken) {
        if (owner.authToken !== hash) {
            return res_1.failure(res, 'invalid token');
        }
    }
    else {
        // done!
        if (proxy_1.isProxy()) {
            tribes.subscribe(`${pubkey}/#`, network.receiveMqttMessage); // add MQTT subsription
        }
        owner.update({ authToken: hash });
    }
    res_1.success(res, { id: (owner && owner.id) || 0 });
});
exports.generateToken = generateToken;
const updateContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, 'no owner');
    const tenant = req.owner.id;
    if (logger_1.logging.Network) {
        console.log('=> updateContact called', {
            body: req.body,
            params: req.params,
            query: req.query,
        });
    }
    let attrs = extractAttrs(req.body);
    const contact = yield models_1.models.Contact.findOne({
        where: { id: req.params.id, tenant },
    });
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
    const contactIds = yield models_1.models.Contact.findAll({
        where: { deleted: false, tenant },
    })
        .filter((c) => c.id !== tenant && c.publicKey)
        .map((c) => c.id);
    if (contactIds.length == 0)
        return;
    console.log('=> send contact_key to', contactIds);
    helpers.sendContactKeys({
        contactIds: contactIds,
        sender: owner,
        type: constants_1.default.message_types.contact_key,
        dontActuallySendContactKey: !contactKeyChanged,
    });
});
exports.updateContact = updateContact;
const exchangeKeys = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, 'no owner');
    const tenant = req.owner.id;
    console.log('=> exchangeKeys called', {
        body: req.body,
        params: req.params,
        query: req.query,
    });
    const contact = yield models_1.models.Contact.findOne({
        where: { id: req.params.id, tenant },
    });
    const owner = req.owner;
    res_1.success(res, jsonUtils.contactToJson(contact));
    helpers.sendContactKeys({
        contactIds: [contact.id],
        sender: owner,
        type: constants_1.default.message_types.contact_key,
    });
});
exports.exchangeKeys = exchangeKeys;
const createContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, 'no owner');
    const tenant = req.owner.id;
    if (logger_1.logging.Network) {
        console.log('=> createContact called', {
            body: req.body,
            params: req.params,
            query: req.query,
        });
    }
    let attrs = extractAttrs(req.body);
    const owner = req.owner;
    const existing = attrs['public_key'] &&
        (yield models_1.models.Contact.findOne({
            where: { publicKey: attrs['public_key'], tenant },
        }));
    if (existing) {
        const updateObj = { fromGroup: false };
        if (attrs['alias'])
            updateObj.alias = attrs['alias'];
        yield existing.update(updateObj);
        return res_1.success(res, jsonUtils.contactToJson(existing));
    }
    if (attrs['public_key'].length > 66)
        attrs['public_key'] = attrs['public_key'].substring(0, 66);
    attrs.tenant = tenant;
    const createdContact = yield models_1.models.Contact.create(attrs);
    const contact = yield createdContact.update(jsonUtils.jsonToContact(attrs));
    res_1.success(res, jsonUtils.contactToJson(contact));
    helpers.sendContactKeys({
        contactIds: [contact.id],
        sender: owner,
        type: constants_1.default.message_types.contact_key,
    });
});
exports.createContact = createContact;
const deleteContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, 'no owner');
    const tenant = req.owner.id;
    const id = parseInt(req.params.id || '0');
    if (!id || id === tenant) {
        res_1.failure(res, 'Cannot delete self');
        return;
    }
    const contact = yield models_1.models.Contact.findOne({ where: { id, tenant } });
    if (!contact)
        return;
    // CHECK IF IN MY TRIBE
    const owner = req.owner;
    const tribesImAdminOf = yield models_1.models.Chat.findAll({
        where: { ownerPubkey: owner.publicKey, tenant },
    });
    const tribesIdArray = tribesImAdminOf &&
        tribesImAdminOf.length &&
        tribesImAdminOf.map((t) => t.id);
    let okToDelete = true;
    if (tribesIdArray && tribesIdArray.length) {
        const thisContactMembers = yield models_1.models.ChatMember.findAll({
            where: { contactId: id, chatId: { [sequelize_1.Op.in]: tribesIdArray }, tenant },
        });
        if (thisContactMembers && thisContactMembers.length) {
            // IS A MEMBER! dont delete, instead just set from_group=true
            okToDelete = false;
            yield contact.update({ fromGroup: true });
        }
    }
    // CHECK IF IM IN THEIR TRIBE
    const tribesTheyreAdminOf = yield models_1.models.Chat.findAll({
        where: { ownerPubkey: contact.publicKey, tenant, deleted: false },
    });
    if (tribesTheyreAdminOf && tribesTheyreAdminOf.length) {
        okToDelete = false;
        yield contact.update({ fromGroup: true });
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
    const chats = yield models_1.models.Chat.findAll({
        where: { deleted: false, tenant },
    });
    chats.map((chat) => __awaiter(void 0, void 0, void 0, function* () {
        if (chat.type === constants_1.default.chat_types.conversation) {
            const contactIds = JSON.parse(chat.contactIds);
            if (contactIds.includes(id)) {
                yield chat.update({
                    deleted: true,
                    uuid: '',
                    contactIds: '[]',
                    name: '',
                });
                yield models_1.models.Message.destroy({ where: { chatId: chat.id, tenant } });
            }
        }
    }));
    yield models_1.models.Invite.destroy({ where: { contactId: id, tenant } });
    yield models_1.models.Subscription.destroy({ where: { contactId: id, tenant } });
    res_1.success(res, {});
});
exports.deleteContact = deleteContact;
const receiveContactKey = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const dat = payload.content || payload;
    const sender_pub_key = dat.sender.pub_key;
    const sender_route_hint = dat.sender.route_hint;
    const sender_contact_key = dat.sender.contact_key;
    const sender_alias = dat.sender.alias || 'Unknown';
    const sender_photo_url = dat.sender.photo_url;
    const owner = payload.owner;
    const tenant = owner.id;
    if (logger_1.logging.Network)
        console.log('=> received contact key from', sender_pub_key, tenant);
    if (!sender_pub_key) {
        return console.log('no pubkey!');
    }
    const sender = yield models_1.models.Contact.findOne({
        where: {
            publicKey: sender_pub_key,
            status: constants_1.default.contact_statuses.confirmed,
            tenant,
        },
    });
    let msgIncludedContactKey = false; // ???????
    if (sender_contact_key) {
        msgIncludedContactKey = true;
    }
    if (sender) {
        const objToUpdate = {};
        if (sender_contact_key)
            objToUpdate.contactKey = sender_contact_key;
        if (sender_alias)
            objToUpdate.alias = sender_alias;
        if (sender_photo_url)
            objToUpdate.photoUrl = sender_photo_url;
        if (Object.keys(objToUpdate).length) {
            yield sender.update(objToUpdate);
        }
        socket.sendJson({
            type: 'contact',
            response: jsonUtils.contactToJson(sender),
        }, tenant);
    }
    else {
        console.log('DID NOT FIND SENDER');
    }
    if (msgIncludedContactKey) {
        helpers.sendContactKeys({
            contactPubKey: sender_pub_key,
            routeHint: sender_route_hint,
            contactIds: sender ? [sender.id] : [],
            sender: owner,
            type: constants_1.default.message_types.contact_key_confirmation,
        });
    }
});
exports.receiveContactKey = receiveContactKey;
const receiveConfirmContactKey = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`=> confirm contact key for ${payload.sender && payload.sender.pub_key}`, JSON.stringify(payload));
    const dat = payload.content || payload;
    const sender_pub_key = dat.sender.pub_key;
    const sender_contact_key = dat.sender.contact_key;
    const sender_alias = dat.sender.alias || 'Unknown';
    const sender_photo_url = dat.sender.photo_url;
    const owner = dat.owner;
    const tenant = owner.id;
    if (!sender_pub_key) {
        return console.log('no pubkey!');
    }
    const sender = yield models_1.models.Contact.findOne({
        where: {
            publicKey: sender_pub_key,
            status: constants_1.default.contact_statuses.confirmed,
            tenant,
        },
    });
    if (sender_contact_key && sender) {
        const objToUpdate = {
            contactKey: sender_contact_key,
        };
        if (sender_alias)
            objToUpdate.alias = sender_alias;
        if (sender_photo_url)
            objToUpdate.photoUrl = sender_photo_url;
        yield sender.update(objToUpdate);
        socket.sendJson({
            type: 'contact',
            response: jsonUtils.contactToJson(sender),
        }, tenant);
    }
});
exports.receiveConfirmContactKey = receiveConfirmContactKey;
function extractAttrs(body) {
    let fields_to_update = [
        'public_key',
        'node_alias',
        'alias',
        'photo_url',
        'device_id',
        'status',
        'contact_key',
        'from_group',
        'private_photo',
        'notification_sound',
        'tip_amount',
        'route_hint',
        'price_to_meet',
    ];
    let attrs = {};
    Object.keys(body).forEach((key) => {
        if (fields_to_update.includes(key)) {
            attrs[key] = body[key];
        }
    });
    return attrs;
}
const getLatestContacts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return res_1.failure(res, 'no owner');
    const tenant = req.owner.id;
    try {
        const dateToReturn = decodeURI(req.query.date);
        const local = moment.utc(dateToReturn).local().toDate();
        const where = {
            updatedAt: { [sequelize_1.Op.gte]: local },
            tenant,
        };
        const contacts = yield models_1.models.Contact.findAll({ where });
        const invites = yield models_1.models.Invite.findAll({ where });
        const chats = yield models_1.models.Chat.findAll({ where });
        const subscriptions = yield models_1.models.Subscription.findAll({ where });
        const contactsResponse = contacts.map((contact) => jsonUtils.contactToJson(contact));
        const invitesResponse = invites.map((invite) => jsonUtils.contactToJson(invite));
        const subsResponse = subscriptions.map((s) => jsonUtils.subscriptionToJson(s, null));
        // const chatsResponse = chats.map((chat) => jsonUtils.chatToJson(chat));
        const chatIds = chats.map((c) => c.id);
        const pendingMembers = yield models_1.models.ChatMember.findAll({
            where: {
                status: constants_1.default.chat_statuses.pending,
                tenant,
                chatId: { [sequelize_1.Op.in]: chatIds },
            },
        });
        const chatsResponse = chats.map((chat) => {
            const theChat = chat.dataValues || chat;
            if (!pendingMembers)
                return jsonUtils.chatToJson(theChat);
            const membs = pendingMembers.filter((m) => m.chatId === chat.id) || [];
            theChat.pendingContactIds = membs.map((m) => m.contactId);
            return jsonUtils.chatToJson(theChat);
        });
        res_1.success(res, {
            contacts: contactsResponse,
            invites: invitesResponse,
            chats: chatsResponse,
            subscriptions: subsResponse,
        });
    }
    catch (e) {
        res_1.failure(res, e);
    }
});
exports.getLatestContacts = getLatestContacts;
//# sourceMappingURL=contacts.js.map