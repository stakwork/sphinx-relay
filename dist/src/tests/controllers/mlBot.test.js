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
exports.mlBot = void 0;
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
const get_1 = require("../utils/get");
const base64images_1 = require("../utils/base64images");
/*
npx ava src/tests/controllers/mlBot.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test ml-bot: create tribe, join tribe, install bot, send messages, receive bot response, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield mlBot(t, 0, 1, 4);
}));
function mlBot(t, index1, index2, index3) {
    return __awaiter(this, void 0, void 0, function* () {
        let alice = nodes_1.default[index1];
        let bob = nodes_1.default[index2];
        let virtualNode1 = nodes_1.default[index3];
        t.truthy(virtualNode1, 'this test requires three nodes');
        console.log(`Checking ml-bot response in tribe for ${alice.alias} and ${bob.alias} and ${virtualNode1.alias}`);
        //ALICE CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, alice);
        t.truthy(tribe, 'tribe should have been created by alice');
        //BOB JOINS TRIBE CREATED BY NODE1
        if (alice.routeHint)
            tribe.owner_route_hint = alice.routeHint;
        let join = yield (0, save_1.joinTribe)(t, bob, tribe);
        t.true(join, 'bob should join tribe');
        //VIRTUALNODE1 JOINS TRIBE CREATED BY NODE1
        let join2 = yield (0, save_1.joinTribe)(t, virtualNode1, tribe);
        t.true(join2, 'node3 should join tribe');
        //Alice installs ML Bot
        const install = '/bot install ml';
        yield (0, msg_1.sendTribeMessage)(t, alice, tribe, install);
        let botAlias = 'MotherBot';
        const botReply = yield (0, get_1.getCheckBotMsg)(t, alice, botAlias, tribe, 1);
        t.truthy(botReply, 'MotherBot should reply');
        botAlias = 'MlBot';
        //http://ml-bot-sphinx-server:3500/text
        const host = 'http://ml-bot-sphinx-server:3500';
        const url = `${host}/text`;
        const model1 = 'gpt';
        //Add Model
        const addModel = `/ml add ${model1}`;
        yield (0, msg_1.sendTribeMessage)(t, alice, tribe, addModel);
        yield (0, helpers_1.sleep)(1000);
        //Alice Set Text URL
        const urlCommand = `/ml url ${model1} ${url}`;
        yield (0, msg_1.sendTribeMessage)(t, alice, tribe, urlCommand);
        yield (0, helpers_1.sleep)(20);
        const botReply2 = yield (0, get_1.getCheckBotMsg)(t, alice, botAlias, tribe, 2);
        t.truthy(botReply2, 'MlBot should reply');
        //Alice set API_KEY
        const api_key = `/ml api_key ${model1} qwerty`;
        const apiKeyMsg = yield (0, msg_1.sendTribeMessage)(t, alice, tribe, api_key);
        const botReply3 = yield (0, get_1.getCheckBotMsg)(t, alice, botAlias, tribe, 3);
        t.truthy(botReply3, 'MlBot should reply');
        const checkNode1 = yield (0, get_1.shouldNotGetNewMsgs)(t, bob, apiKeyMsg.uuid);
        t.true(checkNode1, 'BOB SHOULD NOT SEE THE API_KEY TRIBE COMMAND');
        const checkNode2 = yield (0, get_1.shouldNotGetNewMsgs)(t, virtualNode1, apiKeyMsg.uuid);
        t.true(checkNode2, 'VIRTUALNODE1 SHOULD NOT SEE THE API_KEY TRIBE COMMAND');
        //Bot sends Message in tribe
        const text4 = (0, helpers_1.randomText)();
        const bobMessage = yield (0, msg_1.sendTribeMessage)(t, bob, tribe, text4);
        const botTextResponse = '<div style="position:relative;max-width:fit-content;min-width:180px;"><div style="font-size:15px;margin:5px 0;max-width:90%;">This is a response from test ml-bot server built in sphinx-stack</div></div>';
        const botImageResponse = '<div style="position:relative;max-width:fit-content;min-width:180px;"><div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:10rem;"><img src="https://res.cloudinary.com/teebams/image/upload/v1648478325/elite/wiot5aymifdzqwplyu1a.png" style="max-width:100%;object-fit:cover;"></div></div>';
        yield (0, helpers_1.sleep)(5100);
        const botReply4 = (yield (0, get_1.getCheckBotMsg)(t, bob, botAlias, tribe, 2));
        const botResponse = (0, msg_1.decryptMessage)(bob, botReply4);
        t.true(botResponse === botTextResponse);
        //VirtualNodeShould Node See Message
        const checkNode3 = yield (0, get_1.shouldNotGetNewMsgs)(t, virtualNode1, bobMessage.uuid);
        t.true(checkNode3, 'VIRTUALNODE1 SHOULD NOT SEE Bob Message');
        //Bot sends Message in tribe
        const text5 = (0, helpers_1.randomText)();
        const virtualNode1Message = yield (0, msg_1.sendTribeMessage)(t, virtualNode1, tribe, text5);
        yield (0, helpers_1.sleep)(5100);
        const botReply5 = (yield (0, get_1.getCheckBotMsg)(t, bob, botAlias, tribe, 2));
        const botResponse2 = (0, msg_1.decryptMessage)(bob, botReply5);
        t.true(botResponse2 === botTextResponse);
        //Bob Node Should not See VirtualNode1 Message
        const checkNode4 = yield (0, get_1.shouldNotGetNewMsgs)(t, bob, virtualNode1Message.uuid);
        t.true(checkNode4, 'BOB SHOULD NOT SEE VIRTUALNODE1 Message');
        //Alice change Tribe kind to image
        const imageKind = `/ml kind ${model1} image`;
        yield (0, msg_1.sendTribeMessage)(t, alice, tribe, imageKind);
        const botReply6 = yield (0, get_1.getCheckBotMsg)(t, alice, botAlias, tribe, 8);
        t.truthy(botReply6, 'MlBot should reply');
        const model2 = 'image_gpt';
        const imageUrl = `${host}/image`;
        //Add new Model
        const newModel = `/ml add ${model2} ${imageUrl}`;
        yield (0, msg_1.sendTribeMessage)(t, alice, tribe, newModel);
        yield (0, helpers_1.sleep)(1000);
        //Alice update new model api_key
        const imageUrlMsg = `/ml api_key ${model2} twesting`;
        yield (0, msg_1.sendTribeMessage)(t, alice, tribe, imageUrlMsg);
        const botReply7 = yield (0, get_1.getCheckBotMsg)(t, alice, botAlias, tribe, 10);
        t.truthy(botReply7, 'MlBot should reply');
        yield (0, helpers_1.sleep)(1000);
        //Alice change new model kind to image
        const imageUrlKind = `/ml kind ${model2} image`;
        yield (0, msg_1.sendTribeMessage)(t, alice, tribe, imageUrlKind);
        yield (0, helpers_1.sleep)(1000);
        //Alice sends Message in the tribe
        const text6 = (0, helpers_1.randomText)();
        const aliceMsg = yield (0, msg_1.sendTribeMessage)(t, alice, tribe, `@${model2} ${text6}`);
        yield (0, helpers_1.sleep)(5100);
        const botReply8 = (yield (0, get_1.getCheckBotMsg)(t, alice, botAlias, tribe, 13));
        const botResponse3 = (0, msg_1.decryptMessage)(alice, botReply8);
        t.true(botResponse3 === botImageResponse);
        //Bob Node Should not See Alice Message
        const checkNode5 = yield (0, get_1.shouldNotGetNewMsgs)(t, bob, aliceMsg.uuid);
        t.true(checkNode5, 'BOB SHOULD NOT SEE ALICE Message');
        //VirtualNode1 Should not See Alice Message
        const checkNode6 = yield (0, get_1.shouldNotGetNewMsgs)(t, virtualNode1, aliceMsg.uuid);
        t.true(checkNode6, 'VIRTUALNODE1 SHOULD NOT SEE ALICE Message');
        //VirtualNode1 send message in tribe
        const text9 = (0, helpers_1.randomText)();
        const imageSent = yield (0, msg_1.sendImage)(t, virtualNode1, alice, base64images_1.greenSquare, tribe, 0, '', `@${model2} ${text9}`);
        t.true(!!imageSent, 'message should have been sent');
        yield (0, helpers_1.sleep)(5100);
        const botReply9 = (yield (0, get_1.getCheckBotMsg)(t, virtualNode1, botAlias, tribe, 4));
        const botResponse4 = (0, msg_1.decryptMessage)(virtualNode1, botReply9);
        t.true(botResponse4 === botImageResponse);
        //Bob Node Should not See VirtualNode Message
        const checkNode7 = yield (0, get_1.shouldNotGetNewMsgs)(t, bob, imageSent.uuid);
        t.true(checkNode7, 'BOB SHOULD NOT SEE VirtualNode Message');
        //VirtualNode sends reply bot response to get image URL
        const text10 = (0, helpers_1.randomText)();
        yield (0, msg_1.sendTribeMessage)(t, virtualNode1, tribe, `@${model2} ${text10}`, {
            reply_uuid: botReply9.uuid,
        });
        yield (0, helpers_1.sleep)(5100);
        const botReply10 = (yield (0, get_1.getCheckBotMsg)(t, virtualNode1, botAlias, tribe, 6));
        const botResponse8 = (0, msg_1.decryptMessage)(virtualNode1, botReply10);
        t.true(botResponse8 === botImageResponse);
        //BOB LEAVES TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, bob, tribe);
        t.true(left2, 'bob should leave tribe');
        //VIRTUALNODE1 LEAVES TRIBE
        let left3 = yield (0, del_1.leaveTribe)(t, virtualNode1, tribe);
        t.true(left3, 'virtualNode1 should leave tribe');
        //NODE1 DELETES TRIBE
        let delTribe2 = yield (0, del_1.deleteTribe)(t, alice, tribe);
        t.true(delTribe2, 'alice should delete tribe');
    });
}
exports.mlBot = mlBot;
//# sourceMappingURL=mlBot.test.js.map