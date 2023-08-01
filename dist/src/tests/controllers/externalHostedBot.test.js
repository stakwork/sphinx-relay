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
exports.externalHostedBot = void 0;
const ava_1 = require("ava");
const nodes_1 = require("../nodes");
const save_1 = require("../utils/save");
const del_1 = require("../utils/del");
const msg_1 = require("../utils/msg");
const get_1 = require("../utils/get");
const helpers_1 = require("../utils/helpers");
/*
npx ava src/tests/controllers/externalHostedBot.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield externalHostedBot(t);
}));
function externalHostedBot(t) {
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
        const text = '/bot install example';
        yield (0, msg_1.sendTribeMessage)(t, bob, tribe, text);
        yield (0, helpers_1.sleep)(1000);
        //BOB AWAIT REPLY FROM BOT
        let botAlias = 'example';
        const botReply = yield (0, get_1.getCheckBotMsg)(t, bob, botAlias, tribe, 1);
        t.truthy(botReply, 'Example Bot should reply');
        yield (0, helpers_1.sleep)(1000);
        //ALICE sends message to bot
        const text2 = '/example test';
        yield (0, msg_1.sendTribeMessage)(t, alice, tribe, text2);
        yield (0, helpers_1.sleep)(1000);
        //Alice Await reply from Bot
        const botReply2 = yield (0, get_1.getCheckBotMsg)(t, alice, botAlias, tribe, 2);
        t.truthy(botReply2, 'Example Bot should reply');
        //VirtualNode2 checks if he received example bot response
        const botReply3 = yield (0, get_1.getCheckBotMsg)(t, virtualNode2, botAlias, tribe, 2);
        t.truthy(botReply3, 'Example Bot should reply');
        //Dave checks if he received example bot response
        const botReply7 = yield (0, get_1.getCheckBotMsg)(t, dave, botAlias, tribe, 2);
        t.truthy(botReply7, 'Example Bot should reply');
        //Bot installs Bet Bot
        const text3 = '/bot install bet';
        yield (0, msg_1.sendTribeMessage)(t, bob, tribe, text3);
        yield (0, helpers_1.sleep)(1000);
        //Bot Awaits response from bot
        botAlias = 'bet';
        const botReply4 = yield (0, get_1.getCheckBotMsg)(t, bob, botAlias, tribe, 1);
        t.truthy(botReply4, 'Bet Bot should reply');
        //Virtualnode uses the bet bot
        const text4 = '/bet new price';
        yield (0, msg_1.sendTribeMessage)(t, virtualNode, tribe, text4);
        yield (0, helpers_1.sleep)(1000);
        //VirtualNode wait for response from Bet bot
        const botReply5 = yield (0, get_1.getCheckBotMsg)(t, virtualNode, botAlias, tribe, 2);
        t.truthy(botReply5, 'Bet Bot should reply');
        //Carol checks if she got bot response
        const botReply6 = yield (0, get_1.getCheckBotMsg)(t, carol, botAlias, tribe, 2);
        t.truthy(botReply6, 'Bet Bot should reply');
        //Dave checks if he received response from bet bot
        const botReply8 = yield (0, get_1.getCheckBotMsg)(t, dave, botAlias, tribe, 2);
        t.truthy(botReply8, 'Bet Bot should reply');
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
exports.externalHostedBot = externalHostedBot;
//# sourceMappingURL=externalHostedBot.test.js.map