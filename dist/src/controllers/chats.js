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
exports.receiveGroupCreateOrInvite = exports.receiveGroupLeave = exports.receiveGroupJoin = exports.deleteChat = exports.addGroupMembers = exports.createGroupChat = exports.mute = exports.getChats = exports.receiveGroupKick = exports.kickChatMember = exports.updateChat = void 0;
const models_1 = require("../models");
const jsonUtils = require("../utils/json");
const res_1 = require("../utils/res");
const helpers = require("../helpers");
const network = require("../network");
const socket = require("../utils/socket");
const hub_1 = require("../hub");
const md5 = require("md5");
const tribes = require("../utils/tribes");
const timers = require("../utils/timers");
const chatTribes_1 = require("./chatTribes");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
function updateChat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        console.log('=> updateChat');
        const id = parseInt(req.params.id);
        if (!id) {
            return (0, res_1.failure)(res, 'missing id');
        }
        const chat = yield models_1.models.Chat.findOne({ where: { id, tenant } });
        if (!chat) {
            return (0, res_1.failure)(res, 'chat not found');
        }
        const { name, photo_url, meta, my_alias, my_photo_url } = req.body;
        const obj = {};
        if (name)
            obj.name = name;
        if (photo_url)
            obj.photoUrl = photo_url;
        if (meta && typeof meta === 'string')
            obj.meta = meta;
        if (my_alias)
            obj.myAlias = my_alias;
        if (my_photo_url || my_photo_url === '')
            obj.myPhotoUrl = my_photo_url;
        if (Object.keys(obj).length > 0) {
            yield chat.update(obj);
        }
        (0, res_1.success)(res, jsonUtils.chatToJson(chat));
    });
}
exports.updateChat = updateChat;
function kickChatMember(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const chatId = parseInt(req.params['chat_id']);
        const contactId = parseInt(req.params['contact_id']);
        if (!chatId || !contactId) {
            return (0, res_1.failure)(res, 'missing param');
        }
        // remove chat.contactIds
        let chat = yield models_1.models.Chat.findOne({ where: { id: chatId, tenant } });
        const contactIds = JSON.parse(chat.contactIds || '[]');
        const newContactIds = contactIds.filter((cid) => cid !== contactId);
        yield chat.update({ contactIds: JSON.stringify(newContactIds) });
        // remove from ChatMembers
        yield models_1.models.ChatMember.destroy({
            where: {
                chatId,
                contactId,
                tenant,
            },
        });
        const owner = req.owner;
        network.sendMessage({
            chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [contactId] }),
            sender: owner,
            message: {},
            type: constants_1.default.message_types.group_kick,
        });
        // delete all timers for this member
        timers.removeTimersByContactIdChatId(contactId, chatId, tenant);
        (0, res_1.success)(res, jsonUtils.chatToJson(chat));
    });
}
exports.kickChatMember = kickChatMember;
function receiveGroupKick(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        if (logger_1.logging.Network)
            console.log('=> receiveGroupKick');
        const { owner, chat, sender, date_string, network_type } = yield helpers.parseReceiveParams(payload);
        if (!chat)
            return;
        const tenant = owner.id;
        // const owner = await models.Contact.findOne({where:{isOwner:true}})
        // await chat.update({
        // 	deleted: true,
        // 	uuid:'',
        // 	groupKey:'',
        // 	host:'',
        // 	photoUrl:'',
        // 	contactIds:'[]',
        // 	name:''
        // })
        // await models.Message.destroy({ where: { chatId: chat.id } })
        var date = new Date();
        date.setMilliseconds(0);
        if (date_string)
            date = new Date(date_string);
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.group_kick,
            sender: (sender && sender.id) || 0,
            messageContent: '',
            remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date,
            createdAt: date,
            updatedAt: date,
            network_type,
            tenant,
        };
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'group_kick',
            response: {
                contact: jsonUtils.contactToJson(sender),
                chat: jsonUtils.chatToJson(chat),
                message: jsonUtils.messageToJson(message, null),
            },
        }, tenant);
    });
}
exports.receiveGroupKick = receiveGroupKick;
function getChats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const chats = yield models_1.models.Chat.findAll({
            where: { deleted: false, tenant },
            raw: true,
        });
        const c = chats.map((chat) => jsonUtils.chatToJson(chat));
        (0, res_1.success)(res, c);
    });
}
exports.getChats = getChats;
function mute(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const chatId = req.params['chat_id'];
        const mute = req.params['mute_unmute'];
        if (!['mute', 'unmute'].includes(mute)) {
            return (0, res_1.failure)(res, 'invalid option for mute');
        }
        const chat = yield models_1.models.Chat.findOne({ where: { id: chatId, tenant } });
        if (!chat) {
            return (0, res_1.failure)(res, 'chat not found');
        }
        chat.update({ isMuted: mute == 'mute' });
        (0, res_1.success)(res, jsonUtils.chatToJson(chat));
    });
}
exports.mute = mute;
// just add self here if tribes
// or can u add contacts as members?
function createGroupChat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { name, is_tribe, price_per_message, price_to_join, escrow_amount, escrow_millis, img, description, tags, unlisted, app_url, feed_url, feed_type, } = req.body;
        const contact_ids = req.body.contact_ids || [];
        const members = {}; //{pubkey:{key,alias}, ...}
        const owner = req.owner;
        members[owner.publicKey] = {
            key: owner.contactKey,
            alias: owner.alias,
        };
        yield asyncForEach(contact_ids, (cid) => __awaiter(this, void 0, void 0, function* () {
            const contact = yield models_1.models.Contact.findOne({
                where: { id: cid, tenant },
            });
            members[contact.publicKey] = {
                key: contact.contactKey,
                alias: contact.alias || '',
            };
        }));
        let chatParams = null;
        let okToCreate = true;
        if (is_tribe) {
            chatParams = yield (0, chatTribes_1.createTribeChatParams)(owner, contact_ids, name, img, price_per_message, price_to_join, escrow_amount, escrow_millis, unlisted, req.body.private, app_url, feed_url, feed_type, tenant);
            if (chatParams.uuid) {
                // publish to tribe server
                try {
                    yield tribes.declare({
                        uuid: chatParams.uuid,
                        name: chatParams.name,
                        host: chatParams.host,
                        group_key: chatParams.groupKey,
                        price_per_message: price_per_message || 0,
                        price_to_join: price_to_join || 0,
                        escrow_amount: escrow_amount || 0,
                        escrow_millis: escrow_millis || 0,
                        description,
                        tags,
                        img,
                        owner_pubkey: owner.publicKey,
                        owner_alias: owner.alias,
                        unlisted: unlisted || false,
                        is_private: req.body.private || false,
                        app_url,
                        feed_url,
                        feed_type,
                        owner_route_hint: owner.routeHint || '',
                    });
                }
                catch (e) {
                    console.log('=> couldnt create tribe', e);
                    okToCreate = false;
                }
            }
            // make me owner when i create
            members[owner.publicKey].role = constants_1.default.chat_roles.owner;
        }
        else {
            chatParams = createGroupChatParams(owner, contact_ids, members, name);
        }
        if (!okToCreate) {
            return (0, res_1.failure)(res, 'could not create tribe');
        }
        network.sendMessage({
            chat: Object.assign(Object.assign({}, chatParams), { members }),
            sender: owner,
            type: constants_1.default.message_types.group_create,
            message: {},
            failure: function (e) {
                (0, res_1.failure)(res, e);
            },
            success: function () {
                return __awaiter(this, void 0, void 0, function* () {
                    const chat = yield models_1.models.Chat.create(chatParams);
                    if (chat.type === constants_1.default.chat_types.tribe) {
                        // save me as owner when i create
                        try {
                            yield models_1.models.ChatMember.create({
                                contactId: owner.id,
                                chatId: chat.id,
                                role: constants_1.default.chat_roles.owner,
                                status: constants_1.default.chat_statuses.approved,
                                tenant,
                            });
                        }
                        catch (e) {
                            console.log('=> createGroupChat failed to UPSERT', e);
                        }
                    }
                    (0, res_1.success)(res, jsonUtils.chatToJson(chat));
                });
            },
        });
    });
}
exports.createGroupChat = createGroupChat;
// only owner can do for tribe?
function addGroupMembers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { contact_ids } = req.body;
        const { id } = req.params;
        const members = {}; //{pubkey:{key,alias}, ...}
        const owner = req.owner;
        let chat = yield models_1.models.Chat.findOne({ where: { id, tenant } });
        const contactIds = JSON.parse(chat.contactIds || '[]');
        // for all members (existing and new)
        members[owner.publicKey] = { key: owner.contactKey, alias: owner.alias };
        if (chat.type === constants_1.default.chat_types.tribe) {
            const me = yield models_1.models.ChatMember.findOne({
                where: { contactId: owner.id, chatId: chat.id, tenant },
            });
            if (me)
                members[owner.publicKey].role = me.role;
        }
        const allContactIds = contactIds.concat(contact_ids);
        yield asyncForEach(allContactIds, (cid) => __awaiter(this, void 0, void 0, function* () {
            const contact = yield models_1.models.Contact.findOne({
                where: { id: cid, tenant },
            });
            if (contact) {
                members[contact.publicKey] = {
                    key: contact.contactKey,
                    alias: contact.alias,
                };
                const member = yield models_1.models.ChatMember.findOne({
                    where: { contactId: owner.id, chatId: chat.id, tenant },
                });
                if (member)
                    members[contact.publicKey].role = member.role;
            }
        }));
        (0, res_1.success)(res, jsonUtils.chatToJson(chat));
        network.sendMessage({
            // send ONLY to new members
            chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: contact_ids, members }),
            sender: owner,
            type: constants_1.default.message_types.group_invite,
            message: {},
        });
    });
}
exports.addGroupMembers = addGroupMembers;
const deleteChat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const { id } = req.params;
    const owner = req.owner;
    const chat = yield models_1.models.Chat.findOne({ where: { id, tenant } });
    if (!chat) {
        return (0, res_1.failure)(res, 'you are not in this group');
    }
    const tribeOwnerPubKey = chat.ownerPubkey;
    if (owner.publicKey === tribeOwnerPubKey) {
        // delete a group or tribe
        let notOK = false;
        yield network.sendMessage({
            chat,
            sender: owner,
            message: {},
            type: constants_1.default.message_types.tribe_delete,
            success: function () {
                tribes.delete_tribe(chat.uuid, owner.publicKey);
            },
            failure: function () {
                (0, res_1.failure)(res, 'failed to send tribe_delete message');
                notOK = true;
            },
        });
        if (notOK)
            return console.log('failed to send tribe_delete message');
    }
    else {
        // leave a group or tribe
        const isPending = chat.status === constants_1.default.chat_statuses.pending;
        const isRejected = chat.status === constants_1.default.chat_statuses.rejected;
        if (!isPending && !isRejected) {
            // dont send if pending
            network.sendMessage({
                chat,
                sender: owner,
                message: {},
                type: constants_1.default.message_types.group_leave,
            });
        }
    }
    yield chat.update({
        deleted: true,
        uuid: '',
        groupKey: '',
        host: '',
        photoUrl: '',
        contactIds: '[]',
        name: '',
    });
    yield models_1.models.Message.destroy({ where: { chatId: id, tenant } });
    yield models_1.models.ChatMember.destroy({ where: { chatId: id, tenant } });
    (0, res_1.success)(res, { chat_id: id });
});
exports.deleteChat = deleteChat;
function receiveGroupJoin(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        if (logger_1.logging.Network)
            console.log('=> receiveGroupJoin');
        const { owner, chat, sender_pub_key, sender_alias, chat_members, chat_type, isTribeOwner, date_string, network_type, sender_photo_url, sender_route_hint, chat_name, } = yield helpers.parseReceiveParams(payload);
        const tenant = owner.id;
        if (!chat)
            return;
        const isTribe = chat_type === constants_1.default.chat_types.tribe;
        var date = new Date();
        date.setMilliseconds(0);
        if (date_string)
            date = new Date(date_string);
        let theSender = null;
        const member = chat_members[sender_pub_key];
        const senderAlias = (member && member.alias) || sender_alias || 'Unknown';
        if (!isTribe || isTribeOwner) {
            const sender = yield models_1.models.Contact.findOne({
                where: { publicKey: sender_pub_key, tenant },
            });
            const contactIds = JSON.parse(chat.contactIds || '[]');
            if (sender) {
                theSender = sender; // might already include??
                if (!contactIds.includes(sender.id))
                    contactIds.push(sender.id);
                // update sender contacT_key in case they reset?
                if (member && member.key) {
                    if (sender.contactKey !== member.key) {
                        yield sender.update({ contactKey: member.key });
                    }
                }
            }
            else {
                if (member && member.key) {
                    const createdContact = yield models_1.models.Contact.create({
                        publicKey: sender_pub_key,
                        contactKey: member.key,
                        alias: senderAlias,
                        status: 1,
                        fromGroup: true,
                        photoUrl: sender_photo_url,
                        tenant,
                        routeHint: sender_route_hint || '',
                    });
                    theSender = createdContact;
                    contactIds.push(createdContact.id);
                }
            }
            if (!theSender)
                return console.log('no sender'); // fail (no contact key?)
            yield chat.update({ contactIds: JSON.stringify(contactIds) });
            if (isTribeOwner) {
                // IF TRIBE, ADD new member TO XREF
                console.log('UPSERT CHAT MEMBER', {
                    contactId: theSender.id,
                    chatId: chat.id,
                    role: constants_1.default.chat_roles.reader,
                    status: constants_1.default.chat_statuses.pending,
                    lastActive: date,
                    lastAlias: senderAlias,
                    tenant,
                });
                try {
                    yield models_1.models.ChatMember.upsert({
                        contactId: theSender.id,
                        chatId: chat.id,
                        role: constants_1.default.chat_roles.reader,
                        lastActive: date,
                        status: constants_1.default.chat_statuses.approved,
                        lastAlias: senderAlias,
                        tenant,
                    });
                }
                catch (e) {
                    console.log('=> groupJoin could not upsert ChatMember');
                }
                setTimeout(() => {
                    (0, chatTribes_1.replayChatHistory)(chat, theSender, owner);
                }, 2000);
                tribes.putstats({
                    chatId: chat.id,
                    uuid: chat.uuid,
                    host: chat.host,
                    member_count: contactIds.length,
                    owner_pubkey: owner.publicKey,
                });
            }
        }
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.group_join,
            sender: (theSender && theSender.id) || 0,
            messageContent: '',
            remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date,
            createdAt: date,
            updatedAt: date,
            network_type,
            tenant,
        };
        if (isTribe) {
            msg.senderAlias = sender_alias;
            msg.senderPic = sender_photo_url;
        }
        const message = yield models_1.models.Message.create(msg);
        const theChat = yield (0, chatTribes_1.addPendingContactIdsToChat)(chat, tenant);
        socket.sendJson({
            type: 'group_join',
            response: {
                contact: jsonUtils.contactToJson(theSender || {}),
                chat: jsonUtils.chatToJson(theChat),
                message: jsonUtils.messageToJson(message, null),
            },
        }, tenant);
        if (isTribeOwner) {
            (0, hub_1.sendNotification)(chat, chat_name, 'group_join', owner);
        }
    });
}
exports.receiveGroupJoin = receiveGroupJoin;
function receiveGroupLeave(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        if (logger_1.logging.Network)
            console.log('=> receiveGroupLeave');
        const { chat, owner, sender_pub_key, chat_type, sender_alias, isTribeOwner, date_string, network_type, sender_photo_url, chat_name, } = yield helpers.parseReceiveParams(payload);
        const tenant = owner.id;
        if (!chat)
            return;
        const isTribe = chat_type === constants_1.default.chat_types.tribe;
        let sender;
        // EITHER private chat OR tribeOwner
        if (!isTribe || isTribeOwner) {
            sender = yield models_1.models.Contact.findOne({
                where: { publicKey: sender_pub_key, tenant },
            });
            if (!sender)
                return console.log('=> receiveGroupLeave cant find sender');
            const oldContactIds = JSON.parse(chat.contactIds || '[]');
            const contactIds = oldContactIds.filter((cid) => cid !== sender.id);
            yield chat.update({ contactIds: JSON.stringify(contactIds) });
            if (isTribeOwner) {
                if (chat_type === constants_1.default.chat_types.tribe) {
                    try {
                        yield models_1.models.ChatMember.destroy({
                            where: { chatId: chat.id, contactId: sender.id, tenant },
                        });
                    }
                    catch (e) { }
                    tribes.putstats({
                        chatId: chat.id,
                        uuid: chat.uuid,
                        host: chat.host,
                        member_count: contactIds.length,
                        owner_pubkey: owner.publicKey,
                    });
                }
            }
        }
        var date = new Date();
        date.setMilliseconds(0);
        if (date_string)
            date = new Date(date_string);
        const msg = {
            chatId: chat.id,
            type: constants_1.default.message_types.group_leave,
            sender: (sender && sender.id) || 0,
            messageContent: '',
            remoteMessageContent: '',
            status: constants_1.default.statuses.confirmed,
            date: date,
            createdAt: date,
            updatedAt: date,
            network_type,
            tenant,
        };
        if (isTribe) {
            msg.senderAlias = sender_alias;
            msg.senderPic = sender_photo_url;
        }
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'group_leave',
            response: {
                contact: jsonUtils.contactToJson(sender),
                chat: jsonUtils.chatToJson(chat),
                message: jsonUtils.messageToJson(message, null),
            },
        }, tenant);
        if (isTribeOwner) {
            (0, hub_1.sendNotification)(chat, chat_name, 'group_leave', owner);
        }
    });
}
exports.receiveGroupLeave = receiveGroupLeave;
function validateTribeOwner(chat_uuid, pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const verifiedOwnerPubkey = yield tribes.verifySignedTimestamp(chat_uuid);
        if (verifiedOwnerPubkey === pubkey) {
            return true;
        }
        return false;
    });
}
function receiveGroupCreateOrInvite(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const { owner, sender_pub_key, chat_members, chat_name, chat_uuid, chat_type, chat_host, chat_key, } = yield helpers.parseReceiveParams(payload);
        const tenant = owner.id;
        // maybe this just needs to move to adding tribe owner ChatMember?
        const isTribe = chat_type === constants_1.default.chat_types.tribe;
        if (isTribe) {
            // must be sent by tribe owner?????
            const validOwner = yield validateTribeOwner(chat_uuid, sender_pub_key);
            if (!validOwner)
                return console.log('[tribes] invalid uuid signature!');
        }
        const contacts = [];
        const newContacts = [];
        for (let [pubkey, member] of Object.entries(chat_members)) {
            const contact = yield models_1.models.Contact.findOne({
                where: { publicKey: pubkey, tenant },
            });
            let addContact = false;
            if (chat_type === constants_1.default.chat_types.group && member && member.key) {
                addContact = true;
            }
            else if (isTribe && member && member.role) {
                if (member.role === constants_1.default.chat_roles.owner ||
                    member.role === constants_1.default.chat_roles.admin ||
                    member.role === constants_1.default.chat_roles.mod) {
                    addContact = true;
                }
            }
            if (addContact) {
                if (!contact) {
                    const createdContact = yield models_1.models.Contact.create({
                        publicKey: pubkey,
                        contactKey: member.key,
                        alias: member.alias || 'Unknown',
                        status: 1,
                        fromGroup: true,
                        tenant,
                    });
                    contacts.push(Object.assign(Object.assign({}, createdContact.dataValues), { role: member.role }));
                    newContacts.push(createdContact.dataValues);
                }
                else {
                    contacts.push(Object.assign(Object.assign({}, contact.dataValues), { role: member.role }));
                }
            }
        }
        const contactIds = contacts.map((c) => c.id);
        if (!contactIds.includes(owner.id))
            contactIds.push(owner.id);
        // make chat
        let date = new Date();
        date.setMilliseconds(0);
        const chat = yield models_1.models.Chat.create(Object.assign(Object.assign(Object.assign({ uuid: chat_uuid, contactIds: JSON.stringify(contactIds), createdAt: date, updatedAt: date, name: chat_name, type: chat_type || constants_1.default.chat_types.group }, (chat_host && { host: chat_host })), (chat_key && { groupKey: chat_key })), { tenant }));
        if (isTribe) {
            // IF TRIBE, ADD TO XREF
            contacts.forEach((c) => {
                models_1.models.ChatMember.create({
                    contactId: c.id,
                    chatId: chat.id,
                    role: c.role || constants_1.default.chat_roles.reader,
                    lastActive: date,
                    status: constants_1.default.chat_statuses.approved,
                });
            });
        }
        socket.sendJson({
            type: 'group_create',
            response: jsonUtils.messageToJson({ newContacts }, chat),
        }, tenant);
        // sendNotification(chat, chat_name, "group", owner);
        if (payload.type === constants_1.default.message_types.group_invite) {
            network.sendMessage({
                chat: Object.assign(Object.assign({}, chat.dataValues), { members: {
                        [owner.publicKey]: {
                            key: owner.contactKey,
                            alias: owner.alias || '',
                        },
                    } }),
                sender: owner,
                message: {},
                type: constants_1.default.message_types.group_join,
            });
        }
    });
}
exports.receiveGroupCreateOrInvite = receiveGroupCreateOrInvite;
function createGroupChatParams(owner, contactIds, members, name) {
    let date = new Date();
    date.setMilliseconds(0);
    if (!(owner && members && contactIds && Array.isArray(contactIds))) {
        return;
    }
    const pubkeys = [];
    for (let pubkey of Object.keys(members)) {
        // just the key
        pubkeys.push(String(pubkey));
    }
    if (!(pubkeys && pubkeys.length))
        return;
    const allkeys = pubkeys.includes(owner.publicKey)
        ? pubkeys
        : [owner.publicKey].concat(pubkeys);
    const hash = md5(allkeys.sort().join('-'));
    const theContactIds = contactIds.includes(owner.id)
        ? contactIds
        : [owner.id].concat(contactIds);
    return {
        uuid: `${new Date().valueOf()}-${hash}`,
        contactIds: JSON.stringify(theContactIds),
        createdAt: date,
        updatedAt: date,
        name: name,
        type: constants_1.default.chat_types.group,
    };
}
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=chats.js.map