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
exports.sendImage = void 0;
const node_fetch_1 = require("node-fetch");
const http = require("ava-http");
const RNCryptor = require("jscryptor-3");
const meme_1 = require("../../electronjs/meme");
const rsa_1 = require("../../electronjs/rsa");
const helpers_1 = require("../helpers");
const get_1 = require("../get");
const helpers_2 = require("../helpers");
const config_1 = require("../../config");
function sendImage(t, node1, node2, image, tribe, price, thread_uuid) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 SENDS AN IMAGE TO NODE2
        var token = yield (0, helpers_2.getToken)(t, node1);
        let host = config_1.config.memeHost;
        let fileBase64 = 'data:image/jpg;base64,' + image;
        let typ = 'image/jpg';
        let filename = 'Image.jpg';
        let isPublic = false;
        const upload = yield (0, meme_1.uploadMeme)(fileBase64, typ, host, token, filename, isPublic);
        t.true(typeof upload === 'object', 'meme should have been uploaded');
        t.true(typeof upload.media_key === 'string', 'upload should have media key');
        t.true(typeof upload.muid === 'string', 'upload should have muid');
        let n1contactP1 = {};
        let n2contactP1 = {};
        if (tribe) {
            n1contactP1 = yield (0, get_1.getSelf)(t, node1);
        }
        else {
            ;
            [n1contactP1, n2contactP1] = yield (0, get_1.getContacts)(t, node1, node2);
        }
        //encrypt media_key with node1 contact_key, node1 perspective
        let encrypted_media_key = (0, rsa_1.encrypt)(n1contactP1.contact_key, upload.media_key);
        let encrypted_media_key2;
        let contactIdP1 = null;
        let tribeIdP1 = null;
        let mediaKeyMap = null;
        if (tribe) {
            //encrypt media_key with tribe group_key
            encrypted_media_key2 = (0, rsa_1.encrypt)(tribe.group_key, upload.media_key);
            tribeIdP1 = yield (0, get_1.getTribeIdFromUUID)(t, node1, tribe);
            mediaKeyMap = {
                ['chat']: encrypted_media_key2,
                [n1contactP1.id]: encrypted_media_key,
            };
        }
        else {
            //encrypt media_key with node2 contact_key, node1 perspective
            encrypted_media_key2 = (0, rsa_1.encrypt)(n2contactP1.contact_key, upload.media_key);
            contactIdP1 = n2contactP1.id;
            mediaKeyMap = {
                [n2contactP1.id]: encrypted_media_key2,
                [n1contactP1.id]: encrypted_media_key,
            };
        }
        //media key map is
        //person_sending_to: person_sending_to_contact_key,
        //person_sending: person_sending_contact_key
        //create
        let i = {
            contact_id: contactIdP1,
            chat_id: tribeIdP1,
            muid: upload.muid,
            media_key_map: mediaKeyMap,
            media_type: 'image/jpg',
            text: '',
            amount: 0,
            price: 0 || price,
            thread_uuid,
        };
        //send message from node1 to node2
        const img = yield http.post(node1.external_ip + '/attachment', (0, helpers_2.makeArgs)(node1, i));
        //make sure msg exists
        t.true(img.success, 'sent image should exist');
        const imgMsg = img.response;
        let imgUuid = imgMsg.uuid;
        let url = '';
        let node2MediaKey = '';
        let decryptMediaKey = '';
        if (price) {
            //IF IMAGE HAS A PRICE ===>
            const lastPrePurchMsg = yield (0, get_1.getCheckNewMsgs)(t, node2, imgUuid);
            //create contact_id for purchase message
            let n1contactP2 = {};
            [, n1contactP2] = yield (0, get_1.getContacts)(t, node2, node1);
            let purchContact = n1contactP2.id;
            //create chat_id for purchase message (in tribe and outside tribe)
            let purchChat = null;
            if (tribe) {
                purchChat = yield (0, get_1.getTribeIdFromUUID)(t, node2, tribe);
            }
            else {
                const chats = yield (0, get_1.getChats)(t, node2);
                const selfie = yield (0, get_1.getSelf)(t, node2);
                const selfId = selfie.id;
                const sharedChat = chats.find((chat) => (0, helpers_2.arraysEqual)(chat.contact_ids, [selfId, n1contactP2.id]));
                t.truthy(sharedChat, 'there should be a chat with node1 and node2');
                purchChat = sharedChat === null || sharedChat === void 0 ? void 0 : sharedChat.id;
            }
            //create media_token for purchase message
            const mediaToken = lastPrePurchMsg.media_token;
            //create purchase message object
            let p = {
                contact_id: purchContact,
                chat_id: purchChat,
                amount: price,
                media_token: mediaToken,
            };
            //send purchase message from node2 purchasing node1 image
            const purchased = yield http.post(node2.external_ip + '/purchase', (0, helpers_2.makeArgs)(node2, p));
            t.true(purchased.success, 'purchase message should be posted ' + purchased.error);
            //get payment accepted message
            let paymentMsg = yield (0, get_1.getCheckNewPaidMsgs)(t, node2, imgMsg);
            //get media key from payment accepted message
            //(Last message by token.media_key, type 8, purchase message)
            node2MediaKey = paymentMsg.media_key;
            t.true(typeof node2MediaKey === 'string', 'node2MediaKey should exist');
            //create url with media_token
            const protocol = (0, helpers_2.memeProtocol)(config_1.config.memeHost);
            url = `${protocol}://${config_1.config.memeHost}/file/${paymentMsg.media_token}`;
        }
        else {
            //RECEIVE UNPAID IMAGE ===>
            //Check that image message was received
            yield (0, helpers_1.sleep)(20000);
            const lastMessage2 = yield (0, get_1.getCheckNewMsgs)(t, node2, imgUuid);
            //get media_key from received image message
            node2MediaKey = lastMessage2.media_key;
            t.true(typeof node2MediaKey === 'string', 'node2MediaKey should exist');
            //create url with media_token
            const protocol = (0, helpers_2.memeProtocol)(config_1.config.memeHost);
            url = `${protocol}://${config_1.config.memeHost}/file/${lastMessage2.media_token}`;
        }
        //DECRYPT IMAGE
        decryptMediaKey = (0, rsa_1.decrypt)(node2.privkey, node2MediaKey);
        t.true(typeof decryptMediaKey === 'string', 'decryptMediaKey should exist');
        var token = yield (0, helpers_2.getToken)(t, node2);
        t.true(typeof token === 'string', 'should get media token');
        const res2 = yield (0, node_fetch_1.default)(url, {
            headers: { Authorization: `Bearer ${token}` },
            method: 'GET',
        });
        t.true(typeof res2 === 'object', 'res2 should exist');
        const blob = yield res2.buffer();
        t.true(blob.length > 0, 'blob should exist');
        //media_key needs to be decrypted with your private key
        const dec = RNCryptor.Decrypt(blob.toString('base64'), decryptMediaKey);
        // const b64 = dec.toString('base64')
        // //check equality b64 to b64
        // console.log('image', image)
        // console.log('dec.toStringbase64', dec.toString('base64'))
        t.true(dec.toString('base64') === image, 'image should match!');
        return imgMsg;
    });
}
exports.sendImage = sendImage;
//# sourceMappingURL=sendImage.js.map