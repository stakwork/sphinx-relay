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
exports.spamGoneBot = void 0;
const ava_1 = require("ava");
const nodes_1 = require("../nodes");
const save_1 = require("../utils/save");
const del_1 = require("../utils/del");
const msg_1 = require("../utils/msg");
const get_1 = require("../utils/get");
const helpers_1 = require("../utils/helpers");
/*
npx ava src/tests/controllers/spamGoneBot.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield spamGoneBot(t);
}));
function spamGoneBot(t) {
    return __awaiter(this, void 0, void 0, function* () {
        let alice = nodes_1.default[0];
        let bob = nodes_1.default[1];
        let carol = nodes_1.default[2];
        let dave = nodes_1.default[3];
        let virtualNode = nodes_1.default[4];
        let virtualNode2 = nodes_1.default[5];
        console.log(`Checking external hosted bot in tribe for ${alice.alias} and ${bob.alias} and ${carol.alias} and ${dave.alias} and ${virtualNode.alias} and ${virtualNode2.alias}`);
        //BOB CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, bob);
        t.truthy(tribe, 'tribe should have been created by bob');
        //ALICE JOINS TRIBE CREATED BY NODE1
        if (bob.routeHint)
            tribe.owner_route_hint = bob.routeHint;
        let join = yield (0, save_1.joinTribe)(t, alice, tribe);
        t.true(join, 'node2 should join tribe');
        //CAROL JOINS TRIBE CREATED BY NODE1
        let join2 = yield (0, save_1.joinTribe)(t, carol, tribe);
        t.true(join2, 'node3 should join tribe');
        //DAVE JOINS TRIBE CREATED BY NODE1
        let join3 = yield (0, save_1.joinTribe)(t, dave, tribe);
        t.true(join3, 'Dave should join tribe');
        //VirtualNode1 JOINS TRIBE CREATED BY NODE1
        let join4 = yield (0, save_1.joinTribe)(t, virtualNode, tribe);
        t.true(join4, 'VirtualNode1 should join tribe');
        //VirtualNode2 JOINS TRIBE CREATED BY NODE1
        let join5 = yield (0, save_1.joinTribe)(t, virtualNode2, tribe);
        t.true(join5, 'VirtualNode2 should join tribe');
        //BOB installs Example Bot
        const text = '/bot install spam_gone';
        yield (0, msg_1.sendTribeMessage)(t, bob, tribe, text);
        yield (0, helpers_1.sleep)(1000);
        //BOB AWAIT REPLY FROM BOT
        let botAlias = 'MotherBot';
        const botReply = yield (0, get_1.getCheckBotMsg)(t, bob, botAlias, tribe, 1);
        t.truthy(botReply, 'Mother Bot should reply');
        yield (0, helpers_1.sleep)(1000);
        //Bob adds alice to spam list
        const text2 = `/spam_gone add ${alice.pubkey}`;
        const msg = yield (0, msg_1.sendTribeMessage)(t, bob, tribe, text2);
        //BOB AWAIT REPLY FROM BOT
        botAlias = 'SpamGoneBot';
        const botReply2 = yield (0, get_1.getCheckBotMsg)(t, bob, botAlias, tribe, 1);
        t.truthy(botReply2, 'Example Bot should reply');
        //ALICE SHOULD NOT SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
        const checkAlice = yield (0, get_1.shouldNotGetNewMsgs)(t, alice, msg.uuid);
        t.true(checkAlice, 'NODE 2 SHOULD NOT SEE THE UPDATE TRIBE COMMAND');
        //Alice sends message in tribe
        const text3 = (0, helpers_1.randomText)();
        const msg2 = yield (0, msg_1.sendTribeMessage)(t, alice, tribe, text3);
        //Carol checks content of the message, but will later change to test if the message type is spam
        const checkMsg = yield (0, get_1.getCheckNewMsgs)(t, carol, msg2.uuid);
        t.true(checkMsg.message_content === '', 'Message content should be empty');
        //VirtualNode1 checks content of the message, but will later change to test if the message type is spam
        const checkMsg2 = yield (0, get_1.getCheckNewMsgs)(t, virtualNode, msg2.uuid);
        t.true(checkMsg2.message_content === '', 'Message content should be empty');
        //VirtualNode2 sends message in tribe
        const text6 = (0, helpers_1.randomText)();
        const msg5 = yield (0, msg_1.sendTribeMessage)(t, virtualNode2, tribe, text6);
        //Carol Checks if they received the message
        const checkMsg6 = yield (0, get_1.getCheckNewMsgs)(t, carol, msg5.uuid);
        t.true(checkMsg6.message_content !== '', 'Message content should not be empty');
        //Alice Checks if they received message
        const checkMsg7 = yield (0, get_1.getCheckNewMsgs)(t, alice, msg5.uuid);
        t.true(checkMsg7.message_content !== '', 'Message content should not be empty');
        //VirtualNode1 checks if they received message
        const checkMsg8 = yield (0, get_1.getCheckNewMsgs)(t, virtualNode, msg5.uuid);
        t.true(checkMsg8.message_content !== '', 'Message content should not be empty');
        //Bob removes Alice from spam list
        const text4 = `/spam_gone remove ${alice.pubkey}`;
        const msg3 = yield (0, msg_1.sendTribeMessage)(t, bob, tribe, text4);
        yield (0, helpers_1.sleep)(1000);
        //VIRTUALNODE2 SHOULD NOT SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
        const checkVirtualNode2 = yield (0, get_1.shouldNotGetNewMsgs)(t, virtualNode2, msg3.uuid);
        t.true(checkVirtualNode2, 'NODE 2 SHOULD NOT SEE THE UPDATE TRIBE COMMAND');
        //Alice sends message in tribe
        const text5 = (0, helpers_1.randomText)();
        const msg4 = yield (0, msg_1.sendTribeMessage)(t, alice, tribe, text5);
        //Bob should see the meesage content, will change this to type later
        const checkMsg3 = yield (0, get_1.getCheckNewMsgs)(t, bob, msg4.uuid);
        t.true(checkMsg3.message_content !== '', 'Message content should be available');
        //VirtualNode1 should see the meesage content, will change this to type later
        const checkMsg4 = yield (0, get_1.getCheckNewMsgs)(t, virtualNode2, msg4.uuid);
        t.true(checkMsg4.message_content !== '', 'Message content should be available');
        //ALICE LEAVES TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, alice, tribe);
        t.true(left2, 'node2 should leave tribe');
        //CAROL LEAVES TRIBE
        let left3 = yield (0, del_1.leaveTribe)(t, carol, tribe);
        t.true(left3, 'node3 should leave tribe');
        //DAVE LEAVES TRIBE
        let left4 = yield (0, del_1.leaveTribe)(t, dave, tribe);
        t.true(left4, 'node3 should leave tribe');
        //VirtualNode1 LEAVES TRIBE
        let left5 = yield (0, del_1.leaveTribe)(t, virtualNode, tribe);
        t.true(left5, 'node3 should leave tribe');
        //VirtualNode2 LEAVES TRIBE
        let left6 = yield (0, del_1.leaveTribe)(t, virtualNode2, tribe);
        t.true(left6, 'node3 should leave tribe');
        //BOB DELETES TRIBE
        let delTribe2 = yield (0, del_1.deleteTribe)(t, bob, tribe);
        t.true(delTribe2, 'node1 should delete tribe');
    });
}
exports.spamGoneBot = spamGoneBot;
//# sourceMappingURL=spamGoneBot.test.js.map