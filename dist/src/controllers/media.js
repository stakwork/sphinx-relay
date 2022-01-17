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
exports.getMediaInfo = exports.verifier = exports.signer = exports.receiveAttachment = exports.receivePurchaseDeny = exports.receivePurchaseAccept = exports.receivePurchase = exports.purchase = exports.saveMediaKeys = exports.sendAttachmentMessage = void 0;
const models_1 = require("../models");
const socket = require("../utils/socket");
const jsonUtils = require("../utils/json");
const resUtils = require("../utils/res");
const helpers = require("../helpers");
const hub_1 = require("../hub");
const Lightning = require("../grpc/lightning");
const rp = require("request-promise");
const ldat_1 = require("../utils/ldat");
const meme = require("../utils/meme");
const zbase32 = require("../utils/zbase32");
const schemas = require("./schemas");
const confirmations_1 = require("./confirmations");
const network = require("../network");
const short = require("short-uuid");
const constants_1 = require("../constants");
const config_1 = require("../utils/config");
const res_1 = require("../utils/res");
const logger_1 = require("../utils/logger");
const config = (0, config_1.loadConfig)();
/*

TODO line 233: parse that from token itself, dont use getMediaInfo at all

"attachment": sends a message to a chat with a signed receipt for a file, which can be accessed from sphinx-meme server
If the attachment has a price, then the media must be purchased to get the receipt

"purchase" sends sats.
if the amount matches the price, the media owner
will respond ("purchase_accept" or "purchase_deny" type)
with the signed token, which can only be used by the buyer

purchase_accept should update the original attachment message with the terms and receipt
(both Relay and client need to do this) or make new???

purchase_deny returns the sats
*/
const sendAttachmentMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    // try {
    //   schemas.attachment.validateSync(req.body)
    // } catch(e) {
    //   return resUtils.failure(res, e.message)
    // }
    const { chat_id, contact_id, muid, text, remote_text, remote_text_map, media_key_map, media_type, amount, file_name, ttl, price, // IF AMOUNT>0 THEN do NOT sign or send receipt
    reply_uuid, } = req.body;
    logger_1.sphinxLogger.info(['[send attachment]', req.body]);
    const owner = req.owner;
    const chat = yield helpers.findOrCreateChat({
        chat_id,
        owner_id: owner.id,
        recipient_id: contact_id,
    });
    if (!chat)
        return (0, res_1.failure)(res, 'counldnt findOrCreateChat');
    let TTL = ttl;
    if (ttl) {
        TTL = parseInt(ttl);
    }
    if (!TTL)
        TTL = 31536000; // default year
    const amt = price || 0;
    // generate media token for self!
    const myMediaToken = yield (0, ldat_1.tokenFromTerms)({
        muid,
        ttl: TTL,
        host: '',
        pubkey: owner.publicKey,
        meta: Object.assign(Object.assign({}, (amt && { amt })), { ttl }),
        ownerPubkey: owner.publicKey,
    });
    const date = new Date();
    date.setMilliseconds(0);
    const myMediaKey = (media_key_map && media_key_map[owner.id]) || '';
    const mediaType = media_type || '';
    const remoteMessageContent = remote_text_map
        ? JSON.stringify(remote_text_map)
        : remote_text;
    const uuid = short.generate();
    const mm = {
        chatId: chat.id,
        uuid: uuid,
        sender: owner.id,
        type: constants_1.default.message_types.attachment,
        status: constants_1.default.statuses.pending,
        amount: amount || 0,
        messageContent: text || file_name || '',
        remoteMessageContent,
        mediaToken: myMediaToken,
        mediaKey: myMediaKey,
        mediaType: mediaType,
        date,
        createdAt: date,
        updatedAt: date,
        tenant,
    };
    if (reply_uuid)
        mm.replyUuid = reply_uuid;
    const message = yield models_1.models.Message.create(mm);
    logger_1.sphinxLogger.info(['saved attachment msg from me', message.id]);
    saveMediaKeys(muid, media_key_map, chat.id, message.id, mediaType, tenant);
    const mediaTerms = {
        muid,
        ttl: TTL,
        meta: Object.assign({}, (amt && { amt })),
        skipSigning: amt ? true : false, // only sign if its free
    };
    const msg = {
        mediaTerms,
        id: message.id,
        uuid: uuid,
        content: remote_text_map || remote_text || text || file_name || '',
        mediaKey: media_key_map,
        mediaType: mediaType,
    };
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    network.sendMessage({
        chat: chat,
        sender: owner,
        type: constants_1.default.message_types.attachment,
        amount: amount || 0,
        message: msg,
        success: (data) => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.sphinxLogger.info(['attachment sent', { data }]);
            resUtils.success(res, jsonUtils.messageToJson(message, chat));
        }),
        failure: (error) => resUtils.failure(res, error.message),
    });
});
exports.sendAttachmentMessage = sendAttachmentMessage;
function saveMediaKeys(muid, mediaKeyMap, chatId, messageId, mediaType, tenant) {
    if (typeof mediaKeyMap !== 'object') {
        logger_1.sphinxLogger.error('wrong type for mediaKeyMap');
        return;
    }
    var date = new Date();
    date.setMilliseconds(0);
    for (let [contactId, key] of Object.entries(mediaKeyMap)) {
        if (parseInt(contactId) !== tenant) {
            const receiverID = parseInt(contactId) || 0; // 0 is for a tribe
            models_1.models.MediaKey.create({
                muid,
                chatId,
                key,
                messageId,
                receiver: receiverID,
                createdAt: date,
                mediaType,
                tenant,
            });
        }
    }
}
exports.saveMediaKeys = saveMediaKeys;
const purchase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const tenant = req.owner.id;
    const { chat_id, contact_id, amount, media_token } = req.body;
    var date = new Date();
    date.setMilliseconds(0);
    try {
        schemas.purchase.validateSync(req.body);
    }
    catch (e) {
        return resUtils.failure(res, e.message);
    }
    const owner = req.owner;
    const chat = yield helpers.findOrCreateChat({
        chat_id,
        owner_id: owner.id,
        recipient_id: contact_id,
    });
    if (!chat)
        return (0, res_1.failure)(res, 'counldnt findOrCreateChat');
    const message = yield models_1.models.Message.create({
        chatId: chat.id,
        uuid: short.generate(),
        sender: owner.id,
        type: constants_1.default.message_types.purchase,
        status: constants_1.default.statuses.confirmed,
        amount: amount || 0,
        mediaToken: media_token,
        date: date,
        createdAt: date,
        updatedAt: date,
        network_type: constants_1.default.network_types.lightning,
        tenant,
    });
    const msg = {
        mediaToken: media_token,
        id: message.id,
        uuid: message.uuid,
        purchaser: owner.id, // for tribe, knows who sent
    };
    network.sendMessage({
        chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [contact_id] }),
        sender: owner,
        type: constants_1.default.message_types.purchase,
        realSatsContactId: contact_id,
        message: msg,
        amount: amount,
        success: (data) => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.sphinxLogger.info('purchase sent!');
            resUtils.success(res, jsonUtils.messageToJson(message, chat));
        }),
        failure: (error) => resUtils.failure(res, error.message),
    });
});
exports.purchase = purchase;
/* RECEIVERS */
const receivePurchase = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.sphinxLogger.info(['=> received purchase', { payload }], logger_1.logging.Network);
    var date = new Date();
    date.setMilliseconds(0);
    const { owner, sender, chat, amount, mediaToken, msg_uuid, chat_type, skip_payment_processing, purchaser_id, network_type, } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.error('=> group chat not found!');
    }
    const tenant = owner.id;
    const message = yield models_1.models.Message.create({
        chatId: chat.id,
        uuid: msg_uuid,
        sender: sender.id,
        type: constants_1.default.message_types.purchase,
        status: constants_1.default.statuses.received,
        amount: amount || 0,
        mediaToken: mediaToken,
        date: date,
        createdAt: date,
        updatedAt: date,
        network_type,
        tenant,
    });
    socket.sendJson({
        type: 'purchase',
        response: jsonUtils.messageToJson(message, chat, sender),
    }, tenant);
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    // if sats forwarded from tribe owner, for the >1 time
    // dont need to send back token, because admin already has it
    if (isTribe && skip_payment_processing) {
        return logger_1.sphinxLogger.info('=> skip payment processing');
    }
    const muid = mediaToken && mediaToken.split('.').length && mediaToken.split('.')[1];
    if (!muid) {
        return logger_1.sphinxLogger.error('no muid');
    }
    const ogMessage = yield models_1.models.Message.findOne({
        where: { mediaToken, tenant },
    });
    if (!ogMessage) {
        return logger_1.sphinxLogger.error('no original message');
    }
    // find mediaKey for who sent
    const mediaKey = yield models_1.models.MediaKey.findOne({
        where: {
            muid,
            receiver: isTribe ? 0 : sender.id,
            tenant,
        },
    });
    // console.log('mediaKey found!',mediaKey.dataValues)
    if (!mediaKey)
        return; // this is from another person (admin is forwarding)
    const terms = (0, ldat_1.parseLDAT)(mediaToken);
    // get info
    let TTL = terms.meta && terms.meta.ttl;
    let price = terms.meta && terms.meta.amt;
    if (!TTL || !price) {
        const media = yield getMediaInfo(muid, owner.publicKey);
        logger_1.sphinxLogger.info(['GOT MEDIA', media]);
        if (media) {
            TTL = media.ttl && parseInt(media.ttl);
            price = media.price;
        }
        if (!TTL)
            TTL = 31536000;
        if (!price)
            price = 0;
    }
    if (amount < price) {
        // didnt pay enough
        return network.sendMessage({
            // "purchase_deny"
            chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [sender.id] }),
            sender: owner,
            amount: amount,
            type: constants_1.default.message_types.purchase_deny,
            message: { amount, content: 'Payment Denied', mediaToken },
            success: (data) => __awaiter(void 0, void 0, void 0, function* () {
                logger_1.sphinxLogger.info('purchase_deny sent');
                const denyMsg = yield models_1.models.Message.create({
                    chatId: chat.id,
                    sender: owner.id,
                    type: constants_1.default.message_types.purchase_deny,
                    mediaToken: mediaToken,
                    date: date,
                    createdAt: date,
                    updatedAt: date,
                    tenant,
                });
                socket.sendJson({
                    type: 'purchase_deny',
                    response: jsonUtils.messageToJson(denyMsg, chat, sender),
                }, tenant);
            }),
            failure: (error) => logger_1.sphinxLogger.error(['=> couldnt send purcahse deny', error]),
        });
    }
    const theMediaToken = yield (0, ldat_1.tokenFromTerms)({
        muid,
        ttl: TTL,
        host: '',
        meta: { amt: amount },
        pubkey: sender.publicKey,
        ownerPubkey: owner.publicKey,
    });
    const msgToSend = {
        mediaToken: theMediaToken,
        mediaKey: mediaKey.key,
        mediaType: ogMessage.mediaType,
    };
    if (purchaser_id)
        msgToSend.purchaser = purchaser_id;
    network.sendMessage({
        chat: Object.assign(Object.assign({}, chat.dataValues), { contactIds: [sender.id] }),
        sender: owner,
        type: constants_1.default.message_types.purchase_accept,
        message: msgToSend,
        success: (data) => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.sphinxLogger.info('purchase_accept sent!');
            const acceptMsg = yield models_1.models.Message.create({
                chatId: chat.id,
                sender: owner.id,
                type: constants_1.default.message_types.purchase_accept,
                mediaToken: theMediaToken,
                date: date,
                createdAt: date,
                updatedAt: date,
                tenant,
            });
            socket.sendJson({
                type: 'purchase_accept',
                response: jsonUtils.messageToJson(acceptMsg, chat, sender),
            }, tenant);
        }),
        failure: (error) => logger_1.sphinxLogger.error(['=> couldnt send purchase accept', error]),
    });
});
exports.receivePurchase = receivePurchase;
const receivePurchaseAccept = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.sphinxLogger.info('=> receivePurchaseAccept', logger_1.logging.Network);
    var date = new Date();
    date.setMilliseconds(0);
    const { owner, sender, chat, mediaToken, mediaKey, mediaType, originalMuid, network_type, } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.error('=> no group chat!');
    }
    const tenant = owner.id;
    const termsArray = mediaToken.split('.');
    // const host = termsArray[0]
    const muid = termsArray[1];
    if (!muid) {
        return logger_1.sphinxLogger.error('wtf no muid');
    }
    // const attachmentMessage = await models.Message.findOne({where:{
    //   mediaToken: {$like: `${host}.${muid}%`}
    // }})
    // if(attachmentMessage){
    //   console.log('=> updated msg!')
    //   attachmentMessage.update({
    //     mediaToken, mediaKey
    //   })
    // }
    const msg = yield models_1.models.Message.create({
        chatId: chat.id,
        sender: sender.id,
        type: constants_1.default.message_types.purchase_accept,
        status: constants_1.default.statuses.received,
        mediaToken,
        mediaKey,
        mediaType,
        originalMuid: originalMuid || '',
        date: date,
        createdAt: date,
        updatedAt: date,
        network_type,
        tenant,
    });
    socket.sendJson({
        type: 'purchase_accept',
        response: jsonUtils.messageToJson(msg, chat, sender),
    }, tenant);
});
exports.receivePurchaseAccept = receivePurchaseAccept;
const receivePurchaseDeny = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.sphinxLogger.info('=> receivePurchaseDeny', logger_1.logging.Network);
    var date = new Date();
    date.setMilliseconds(0);
    const { owner, sender, chat, amount, mediaToken, network_type } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.error('=> no group chat!');
    }
    const tenant = owner.id;
    const msg = yield models_1.models.Message.create({
        chatId: chat.id,
        sender: sender.id,
        type: constants_1.default.message_types.purchase_deny,
        status: constants_1.default.statuses.received,
        messageContent: 'Purchase has been denied and sats returned to you',
        amount: amount,
        amountMsat: parseFloat(amount) * 1000,
        mediaToken,
        date: date,
        createdAt: date,
        updatedAt: date,
        network_type,
        tenant,
    });
    socket.sendJson({
        type: 'purchase_deny',
        response: jsonUtils.messageToJson(msg, chat, sender),
    }, tenant);
});
exports.receivePurchaseDeny = receivePurchaseDeny;
const receiveAttachment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('received attachment', { payload })
    var date = new Date();
    date.setMilliseconds(0);
    const { owner, sender, chat, mediaToken, mediaKey, mediaType, content, msg_id, chat_type, sender_alias, msg_uuid, reply_uuid, network_type, sender_photo_url, } = yield helpers.parseReceiveParams(payload);
    if (!owner || !sender || !chat) {
        return logger_1.sphinxLogger.error('=> no group chat!');
    }
    const tenant = owner.id;
    const msg = {
        chatId: chat.id,
        uuid: msg_uuid,
        type: constants_1.default.message_types.attachment,
        status: constants_1.default.statuses.received,
        sender: sender.id,
        date: date,
        createdAt: date,
        updatedAt: date,
        network_type,
        tenant,
    };
    if (content)
        msg.messageContent = content;
    if (mediaToken)
        msg.mediaToken = mediaToken;
    if (mediaKey)
        msg.mediaKey = mediaKey;
    if (mediaType)
        msg.mediaType = mediaType;
    if (reply_uuid)
        msg.replyUuid = reply_uuid;
    const isTribe = chat_type === constants_1.default.chat_types.tribe;
    if (isTribe) {
        msg.senderAlias = sender_alias;
        msg.senderPic = sender_photo_url;
    }
    const message = yield models_1.models.Message.create(msg);
    // console.log('saved attachment', message.dataValues)
    socket.sendJson({
        type: 'attachment',
        response: jsonUtils.messageToJson(message, chat, sender),
    }, tenant);
    (0, hub_1.sendNotification)(chat, msg.senderAlias || sender.alias, 'message', owner);
    (0, confirmations_1.sendConfirmation)({ chat, sender: owner, msg_id, receiver: sender });
});
exports.receiveAttachment = receiveAttachment;
function signer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        // const tenant:number = req.owner.id
        if (!req.params.challenge)
            return resUtils.failure(res, 'no challenge');
        try {
            const sig = yield Lightning.signBuffer(Buffer.from(req.params.challenge, 'base64'), req.owner.publicKey);
            const sigBytes = zbase32.decode(sig);
            const sigBase64 = (0, ldat_1.urlBase64FromBytes)(sigBytes);
            resUtils.success(res, {
                sig: sigBase64,
            });
        }
        catch (e) {
            resUtils.failure(res, e);
        }
    });
}
exports.signer = signer;
function verifier(msg, sig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield Lightning.verifyMessage(msg, sig);
            return res;
        }
        catch (e) {
            logger_1.sphinxLogger.error(e);
        }
    });
}
exports.verifier = verifier;
function getMediaInfo(muid, pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield meme.lazyToken(pubkey, config.media_host);
            const host = config.media_host;
            let protocol = 'https';
            if (host.includes('localhost'))
                protocol = 'http';
            if (host.includes('meme.sphinx:5555'))
                protocol = 'http';
            const mediaURL = `${protocol}://${host}/`;
            const res = yield rp.get(mediaURL + 'mymedia/' + muid, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                json: true,
            });
            return res;
        }
        catch (e) {
            return null;
        }
    });
}
exports.getMediaInfo = getMediaInfo;
//# sourceMappingURL=media.js.map