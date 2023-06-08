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
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
const del_1 = require("../utils/del");
const get_1 = require("../utils/get");
const helpers_1 = require("../utils/helpers");
/*
npx ava src/tests/controllers/silentTribeBotMsg.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test-30-slinetTribeBotMsg: create tribe, install to tribe bot, send hidden tribe commands, delete bot, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield silentTribeBotMsg(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function silentTribeBotMsg(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE3 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join2 = yield (0, save_1.joinTribe)(t, node3, tribe);
        t.true(join2, 'node3 should join tribe');
        yield (0, helpers_1.sleep)(1000);
        //NODE1 INSTALLS CALLRECORDING BOT
        const text2 = '/bot install callRecording';
        yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text2);
        yield (0, helpers_1.sleep)(1000);
        //NODE1 INSTALLS WELCOME BOT
        const text = '/bot install welcome';
        yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text);
        yield (0, helpers_1.sleep)(2000);
        //NODE1 USES THE UPDATE COMMAND FOR CALLRECORDING BOT
        const text3 = '/callRecording update 1 jitsi_server s3_bucket_url stakwork_api_key webhook_url';
        const updateCall = yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text3);
        //NODE1 SHOULD SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
        const checkNode1 = yield (0, get_1.getCheckNewMsgs)(t, node1, updateCall.uuid);
        t.truthy(checkNode1, 'NODE 1 SHOULD SEE THE UPDATE TRIBE COMMAND');
        //NODE2 SHOULD NOT SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
        const checkNode2 = yield (0, get_1.shouldNotGetNewMsgs)(t, node2, updateCall.uuid);
        t.true(checkNode2, 'NODE 2 SHOULD NOT SEE THE UPDATE TRIBE COMMAND');
        //NODE3 SHOULD NOT SEE THE UPDATE COMMAND MESSAGE SENT TO THE TRIBE
        const checkNode3 = yield (0, get_1.shouldNotGetNewMsgs)(t, node3, updateCall.uuid);
        t.true(checkNode3, 'NODE 3 SHOULD NOT SEE THE UPDATE TRIBE COMMAND');
        //NODE1 SHOULD SEE THE BOT RESPONSE FOR THE UPDATE COMMAND
        let botAlias = 'CallRecordingBot';
        const botReply = yield (0, get_1.getCheckBotMsg)(t, node1, botAlias, tribe, 1);
        t.truthy(botReply, 'CallRecordingBot should reply');
        //NODE2 SHOULD NOT SEE THE BOT RESPONSE FOR THE UPDATE CALL RECORDING COMMAND
        const botReply2 = yield (0, get_1.shouldNotGetBotRes)(t, node2, botAlias);
        t.truthy(botReply2, 'CallRecordingBot should not reply to NODE2');
        //NODE3 SHOULD NOT SEE THE BOT RESPONSE FOR THE UPDATE CALL RECORDING COMMAND
        const botReply3 = yield (0, get_1.shouldNotGetBotRes)(t, node3, botAlias);
        t.truthy(botReply3, 'CallRecordingBot should not reply to NODE3');
        //NODE1 USES THE THE HIDE COMMAND TO HIDE THE SETMESSAGE WELCOME BOT COMMAND
        const hideMsg = '/welcome hide setmessage';
        const hideMsgRes = yield (0, msg_1.sendTribeMessage)(t, node1, tribe, hideMsg);
        // NODE1 SHOULD SEE THE HIDE SETMESSAGE COMMAND
        const checkHideCmd = yield (0, get_1.getCheckNewMsgs)(t, node1, hideMsgRes.uuid);
        t.truthy(checkHideCmd, 'NODE 1 SHOULD SEE THE HIDE COMMAND');
        //NODE2 SHOULD NOT SEE THE HIDE MESSAGE COMMAND
        const checkHideCmd2 = yield (0, get_1.shouldNotGetNewMsgs)(t, node2, hideMsgRes.uuid);
        t.true(checkHideCmd2, 'NODE 2 SHOULD NOT SEE THE HIDE COMMAND');
        //NODE3 SHOULD NOT SEE THE HIDE MESSAGE COMMAND
        const checkHideCmd3 = yield (0, get_1.shouldNotGetNewMsgs)(t, node3, hideMsgRes.uuid);
        t.true(checkHideCmd3, 'NODE 3 SHOULD NOT SEE THE HIDE COMMAND');
        //NODE1 SHOULD SEE THE BOT RESPONSE FOR THE HIDE COMMAND
        let welcomeBotRes = 'WelcomeBot';
        const welcomeBotReply = yield (0, get_1.getCheckBotMsg)(t, node1, welcomeBotRes, tribe, 1);
        t.truthy(welcomeBotReply, 'WelcomeBot should reply');
        //NODE2 SHOULD NOT SEE THE BOT RESPONSE FOR THE HIDE SET MESSAGE COMMAND
        const welcomeBotReply1 = yield (0, get_1.shouldNotGetBotRes)(t, node2, welcomeBotRes);
        t.truthy(welcomeBotReply1, 'WelcomeBot should not reply');
        //NODE3 SHOULD NOT SEE THE BOT RESPONSE FOR THE HIDE SET MESSAGE COMMAND
        const welcomeBotReply2 = yield (0, get_1.shouldNotGetBotRes)(t, node3, welcomeBotRes);
        t.truthy(welcomeBotReply2, 'WelcomeBot should not reply');
        //NODE1 SETS WELCOME BOT MESSAGE
        const setMsg = '/welcome setmessage Welcome to the new tribe';
        const setMsgRes = yield (0, msg_1.sendTribeMessage)(t, node1, tribe, setMsg);
        //NODE2 SHOULD NOT TO SEE THE MESSAGE USED TO SET THE WELCOME MESSAGE
        const checkSetMsgCmd = yield (0, get_1.shouldNotGetNewMsgs)(t, node2, setMsgRes.uuid);
        t.true(checkSetMsgCmd, 'NODE 2 SHOULD NOT SEE THE SETMESSAGE COMMAND');
        //NODE3 SHOULD NOT TO SEE THE MESSAGE USED TO SET THE WELCOME MESSAGE
        const checkSetMsgCmd2 = yield (0, get_1.shouldNotGetNewMsgs)(t, node3, setMsgRes.uuid);
        t.true(checkSetMsgCmd2, 'NODE 3 SHOULD NOT SEE THE SETMESSAGE COMMAND');
        //NODE1 SHOULD SEE THE BOT RESPONSE FOR THE SET MESSAGE COMMAND
        let welcomeBotAlias = 'WelcomeBot';
        const setMsgReply = yield (0, get_1.getCheckBotMsg)(t, node1, welcomeBotAlias, tribe, 2);
        t.truthy(setMsgReply, 'WelcomeBot should reply');
        //NODE2 SHOULD NOT SEE THE BOT RESPONSE FOR THE SET MESSAGE COMMAND
        const welcomeBotReply3 = yield (0, get_1.shouldNotGetBotRes)(t, node2, welcomeBotAlias);
        t.truthy(welcomeBotReply3, 'WelcomeBot should not reply');
        //NODE3 SHOULD NOT SEE THE BOT RESPONSE FOR THE SET MESSAGE COMMAND
        const welcomeBotReply4 = yield (0, get_1.shouldNotGetBotRes)(t, node3, welcomeBotAlias);
        t.truthy(welcomeBotReply4, 'WelcomeBot should not reply');
        //NODE2 LEAVES THE TRIBE
        let left = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left, 'node2 should leave tribe');
        //NODE3 LEAVES THE TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, node3, tribe);
        t.true(left2, 'node3 should leave tribe');
        //NODE1 DELETES THE TRIBE
        let delTribe = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
//# sourceMappingURL=silentTribeBotMsg.test.js.map