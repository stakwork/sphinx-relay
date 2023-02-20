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
exports.kickBotTest = void 0;
const ava_1 = require("ava");
const nodes_1 = require("../nodes");
const save_1 = require("../utils/save");
const get_1 = require("../utils/get");
const msg_1 = require("../utils/msg");
const del_1 = require("../utils/del");
const helpers_1 = require("../utils/helpers");
/*
npx ava src/tests/controllers/kickBot.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test kick bot: create tribe, join tribe, add user to blacklist, remove user from blacklist, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield kickBotTest(t, 0, 1, 2);
}));
function kickBotTest(t, index1, index2, index3) {
    return __awaiter(this, void 0, void 0, function* () {
        let node1 = nodes_1.default[index1];
        let node2 = nodes_1.default[index2];
        let node3 = nodes_1.default[index3];
        console.log(nodes_1.default);
        console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE1 SENDS A BOT HELP MESSAGE IN TRIBE
        const text = '/bot help';
        yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text);
        //NODE1 AWAIT REPLY FROM BOT
        let botAlias = 'MotherBot';
        const botReply = yield (0, get_1.getCheckBotMsg)(t, node1, botAlias);
        t.truthy(botReply, 'MotherBot should reply');
        //NODE1 Installs kick bot
        const text2 = '/bot install kick';
        yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text2);
        //AWAIT KICK BOT RESPONSE
        botAlias = 'MotherBot';
        const botReply2 = yield (0, get_1.getCheckBotMsg)(t, node1, botAlias);
        t.truthy(botReply2, 'MotherBot should reply');
        //NODE2 JOINS TRIBE
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE1 KICKS NODE2 OUT OF THE TRIBE AND ADDED NODE2 TO BLACKLIST
        const addPubkey = `/kick add ${node2.pubkey}`;
        yield (0, msg_1.sendTribeMessage)(t, node1, tribe, addPubkey);
        //AWAIT KICK BOT RESPONSE
        botAlias = 'KickBot';
        const botReply3 = yield (0, get_1.getCheckBotMsg)(t, node1, botAlias);
        t.truthy(botReply3, 'MotherBot should reply');
        //NODE1 CHECKS TRIBE MEMBERS AND NODE2 SHOULD NOT BE A MEMBER
        const member = yield (0, get_1.checkTribeMember)(t, node1, node2, tribe);
        t.false(member, 'Node2 should not be a member of the tribe');
        //NODE2 DELETE TRIBE
        let delTribe = yield (0, del_1.deleteTribe)(t, node2, tribe);
        t.true(delTribe, 'node2 should delete tribe for himself');
        //NODE2 TRIES TO JOIN TRIBE AGAIN
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join2 = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join2, 'node2 should join tribe');
        yield (0, helpers_1.sleep)(30000);
        //NODE2 DELETE TRIBE
        let delTribe2 = yield (0, del_1.deleteTribe)(t, node2, tribe);
        t.true(delTribe2, 'node2 should delete tribe for himself');
        //NODE2 SHOULD NOT BE PART OF THIS TRIBE AGAIN
        const member2 = yield (0, get_1.checkTribeMember)(t, node1, node2, tribe);
        t.false(member2, 'Node2 should not be a member of the tribe');
        //NODE1 REMOVES NODE2 FROM BLACKLIST
        const removePubkey = `/kick remove ${node2.pubkey}`;
        yield (0, msg_1.sendTribeMessage)(t, node1, tribe, removePubkey);
        //AWAIT KICK BOT RESPONSE
        botAlias = 'KickBot';
        const botReply4 = yield (0, get_1.getCheckBotMsg)(t, node1, botAlias);
        t.truthy(botReply4, 'MotherBot should reply');
        //NODE2 JOINS TRIBE AGAIN AND SHOULD BE ABLE TO JOIN TRIBE
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join3 = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join3, 'node2 should join tribe');
        //CHECK IF NODE2 IS NOW A TRIBE MEMBER
        const member3 = yield (0, get_1.checkTribeMember)(t, node1, node2, tribe);
        t.true(member3, 'Node2 should be a member of the tribe');
        //NODE1 ADDS NODE3 TO BLACKLIST
        const addPubkey2 = `/kick add ${node3.pubkey}`;
        yield (0, msg_1.sendTribeMessage)(t, node1, tribe, addPubkey2);
        console.log(node3.pubkey);
        //AWAIT KICK BOT RESPONSE
        botAlias = 'KickBot';
        const botReply5 = yield (0, get_1.getCheckBotMsg)(t, node1, botAlias);
        t.truthy(botReply5, 'MotherBot should reply');
        //NODE3 TRIES TO JOIN TRIBE
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join4 = yield (0, save_1.joinTribe)(t, node3, tribe);
        t.true(join4, 'node4 should join tribe');
        yield (0, helpers_1.sleep)(50000);
        //DELETE TRIBE BY NODE3 AFTER BEING KICKED OUT
        let delTribe3 = yield (0, del_1.deleteTribe)(t, node3, tribe);
        t.true(delTribe3, 'node3 should delete tribe for himself');
        //CHECK IF NODE3 IS A TRIBE MEMBER
        const member4 = yield (0, get_1.checkTribeMember)(t, node1, node3, tribe);
        t.false(member4, 'Node3 should not be a member of the tribe');
        //NODE2 LEAVES TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left2, 'node2 should leave tribe');
        //NODE1 DELETE TRIBE
        let delTribe4 = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe4, 'node1 should delete tribe');
    });
}
exports.kickBotTest = kickBotTest;
//# sourceMappingURL=kickBot.test.js.map