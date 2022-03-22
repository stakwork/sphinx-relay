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
const ava_1 = require("ava");
const moment = require("moment");
const nodes_1 = require("../nodes");
const helpers_1 = require("../utils/helpers");
const get_1 = require("../utils/get");
const http = require("ava-http");
const rsa = require("../../crypto/rsa");
const helpers_2 = require("../utils/helpers");
ava_1.default.serial('checkContactsWithTransportToken', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield (0, helpers_1.iterate)(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield checkContactsWithTransportToken(t, node1, node2);
        yield check1MinuteOldRequest(t, node1, node2);
        yield checkDuplicateTransportTokens(t, node1, node2);
    }));
}));
function checkDuplicateTransportTokens(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = {
            alias: `${node2.alias}`,
            public_key: node2.pubkey,
            status: 1,
            route_hint: node2.routeHint || '',
        };
        const currentTime = moment().unix();
        console.log('This is the current time: ', currentTime);
        const transportToken = rsa.encrypt(node1.transportToken, `${node1.authToken}|${moment().unix()}`);
        let added = yield http.post(node1.external_ip + '/contacts', {
            headers: {
                'x-transport-token': transportToken,
            },
            body,
        });
        t.true(added.success, 'we should get back a value from the request');
        let error;
        let added2;
        try {
            added2 = yield http.post(node1.external_ip + '/contacts', {
                headers: {
                    'x-transport-token': transportToken,
                },
                body,
            });
        }
        catch (e) {
            error = e;
        }
        t.true(added2 == undefined, 'added2 should remain undefined as the try catch should fail');
        t.true(error.statusCode == 401, 'node1 should have failed due to old transportToken and have 401 code');
        t.true(error.error == 'invalid credentials', 'node1 should have failed due to old and should have correct error');
    });
}
function check1MinuteOldRequest(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = {
            alias: `${node2.alias}`,
            public_key: node2.pubkey,
            status: 1,
            route_hint: node2.routeHint || '',
        };
        const currentTime = moment().unix() - 1 * 60001;
        let error;
        try {
            yield http.post(node1.external_ip + '/contacts', {
                headers: {
                    'x-transport-token': rsa.encrypt(node1.transportToken, `${node1.authToken}|${currentTime.toString()}`),
                },
                body,
            });
        }
        catch (e) {
            error = e;
        }
        t.true(error.statusCode == 401, 'node1 should have failed due to old transportToken and have 401 code');
        t.true(error.error == 'invalid credentials', 'node1 should have failed due to old and should have correct error');
    });
}
function checkContactsWithTransportToken(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`=> checkContactsWithTransportToken ${node1.alias} -> ${node2.alias}`);
        // NODE1 ADDS NODE2 AS A CONTACT
        // contact_key should be populated via key exchange in a few seconds
        let added = yield addContact(t, node1, node2);
        t.true(added, 'node1 should add node2 as contact');
        console.log('added contact!');
        const text = (0, helpers_1.randomText)();
        let messageSent = yield sendMessageAndCheckDecryption(t, node1, node2, text);
        t.truthy(messageSent, 'node1 should send text message to node2');
        console.log('sent message!');
    });
}
function addContact(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //object of node2node for adding as contact
        const body = {
            alias: `${node2.alias}`,
            public_key: node2.pubkey,
            status: 1,
            route_hint: node2.routeHint || '',
        };
        //node1 adds node2 as contact
        const add = yield http.post(node1.external_ip + '/contacts', (0, helpers_2.makeArgs)(node1, body, { useTransportToken: true }));
        t.true(typeof add.response === 'object', 'add contact should return object');
        //create node2 id based on the post response
        var node2id = add && add.response && add.response.id;
        //check that node2id is a number and therefore exists (contact was posted)
        t.true(typeof node2id === 'number', 'node1id should be a number');
        //await contact_key
        const [n1contactP1, n2contactP1] = yield (0, get_1.getContactAndCheckKeyExchange)(t, node1, node2);
        //make sure node 2 has the contact_key
        t.true(typeof n2contactP1.contact_key === 'string', 'node2 should have a contact key');
        t.true(typeof n1contactP1 === 'object', 'node1 should be its own first contact');
        return true;
    });
}
function sendMessageAndCheckDecryption(t, node1, node2, text, options) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 SENDS TEXT MESSAGE TO NODE2
        const [node1contact, node2contact] = yield (0, get_1.getContactAndCheckKeyExchange)(t, node1, node2);
        //encrypt random string with node1 contact_key
        const encryptedText = rsa.encrypt(node1contact.contact_key, text);
        //encrypt random string with node2 contact_key
        const remoteText = rsa.encrypt(node2contact.contact_key, text);
        //create message object with encrypted texts
        const v = {
            contact_id: node2contact.id,
            chat_id: null,
            text: encryptedText,
            remote_text_map: { [node2contact.id]: remoteText },
            amount: (options && options.amount) || 0,
            reply_uuid: '',
            boost: false,
        };
        //send message from node1 to node2
        const msg = yield http.post(node1.external_ip + '/messages', (0, helpers_2.makeArgs)(node1, v, { useTransportToken: true }));
        //make sure msg exists
        t.true(msg.success, 'msg should exist');
        const msgUuid = msg.response.uuid;
        t.truthy(msg.success, msgUuid);
        // //wait for message to process
        const lastMessage = yield getCheckNewMsgs(t, node2, msgUuid);
        t.truthy(lastMessage, 'await message post');
        //decrypt the last message sent to node2 using node2 private key and lastMessage content
        const decrypt = rsa.decrypt(node2.privkey, lastMessage.message_content);
        //the decrypted message should equal the random string input before encryption
        t.true(decrypt === text, 'decrypted text should equal pre-encryption text');
        return msg.response;
    });
}
function getCheckNewMsgs(_t, node, msgUuid) {
    return new Promise((resolve, reject) => {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(0, node, msgUuid, resolve, reject);
        }), 1000);
    });
}
function timeout(i, node, msgUuid, resolve, reject) {
    return __awaiter(this, void 0, void 0, function* () {
        const msgRes = yield http.get(node.external_ip + '/messages', (0, helpers_2.makeArgs)(node, {}, { useTransportToken: true }));
        if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
            // console.log('===>', msgRes.response.new_messages, msgUuid)
            const lastMessage = msgRes.response.new_messages.find((msg) => msg.uuid === msgUuid);
            if (lastMessage) {
                return resolve(lastMessage);
            }
        }
        if (i > 10) {
            return reject('failed to getCheckNewMsgs');
        }
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(i + 1, node, msgUuid, resolve, reject);
        }), 1000);
    });
}
//# sourceMappingURL=transportToken.test.js.map