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
const del_1 = require("../utils/del");
const bots_1 = require("../utils/bots");
const save_1 = require("../utils/save");
const get_1 = require("../utils/get");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
//var h = require('../utils/helpers')
//var r = require('../test-config')
/*
npx ava test-30-botCreation.js --verbose --serial --timeout=2m
*/
ava_1.default('test-30-botCreation: create tribe, create bot, add bot to tribe, delete bot, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield botCreation(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function botCreation(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        //CHECK BOT CREATION WITHIN A TRIBE ===>
        console.log(`${node1.alias} and ${node2.alias} and ${node3.alias}`);
        //NODE1 CREATES A TRIBE
        let tribe = yield save_1.createTribe(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield save_1.joinTribe(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE1 SENDS A BOT HELP MESSAGE IN TRIBE
        const text = '/bot help';
        yield msg_1.sendTribeMessage(t, node1, tribe, text);
        //NODE1 AWAIT REPLY FROM BOT
        var botAlias = 'MotherBot';
        const botReply = yield get_1.getCheckBotMsg(t, node1, botAlias);
        t.truthy(botReply, 'MotherBot should reply');
        // console.log("BOTREPLY === ", JSON.stringify(botReply))
        //NODE1 SENDS A BOT INSTALL MESSAGE IN TRIBE
        const text2 = '/bot install welcome';
        yield msg_1.sendTribeMessage(t, node1, tribe, text2);
        //NODE1 AWAIT REPLY FROM BOT
        botAlias = 'MotherBot';
        const botReply2 = yield get_1.getCheckBotMsg(t, node1, botAlias);
        t.truthy(botReply2, 'MotherBot should reply');
        // console.log("BOTREPLY === ", JSON.stringify(botReply2))
        //NODE1 SENDS A BOT SET WELCOME MESSAGE IN TRIBE
        const setMessage = '/welcome setmessage ';
        const newWelcomeMessage = "You're in my test tribe now";
        const text3 = setMessage + newWelcomeMessage;
        yield msg_1.sendTribeMessage(t, node1, tribe, text3);
        //NODE1 AWAIT REPLY FROM BOT
        botAlias = 'WelcomeBot';
        const botReply3 = yield get_1.getCheckBotMsg(t, node1, botAlias);
        t.truthy(botReply3, 'WelcomeBot should reply');
        // console.log("BOTREPLY === ", JSON.stringify(botReply3))
        //NODE3 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join2 = yield save_1.joinTribe(t, node3, tribe);
        t.true(join2, 'node3 should join tribe');
        //NODE3 AWAIT REPLY FROM BOT
        botAlias = 'WelcomeBot';
        const botReply4 = yield get_1.getCheckBotMsg(t, node3, botAlias);
        t.truthy(botReply4, 'WelcomeBot should reply');
        // console.log("BOTREPLY === ", JSON.stringify(botReply3))
        //CHECK THAT BOT'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n3check = yield bots_1.botDecrypt(t, node3, newWelcomeMessage, botReply4);
        t.true(n3check, "node3 should have read and decrypted bot's message");
        // //CREATE NEW BOT
        // const newBot = await f.botCreate(t, node1, "TestBot", "https://sphinx-random.herokuapp.com/")
        // t.true(newBot.success, "new bot should have been created")
        // const checkBots = await f.getBots(t, node1)
        // console.log('CHECK BOTS === ', JSON.stringify(checkBots.bots))
        //     //NODE1 SENDS A BOT SEARCH MESSAGE IN TRIBE
        //     const text8 = "/bot search TestBot"
        //     let tribeMessage8 = await f.sendTribeMessage(t, node1, tribe, text8)
        //     t.true(tribeMessage8.success, "node1 should seach for new bot")
        //             //NODE1 SENDS A BOT INSTALL MESSAGE IN TRIBE
        //             const text9 = "/bot install testbot"
        //             let tribeMessage9 = await f.sendTribeMessage(t, node1, tribe, text9)
        //             t.true(tribeMessage9.success, "node1 should install the new bot")
        //                 await h.sleep(5000)
        //                             //NODE1 SENDS A TESTBOT MESSAGE IN TRIBE
        //                             const text10 = "/testbot 8"
        //                             let tribeMessage10 = await f.sendTribeMessage(t, node1, tribe, text10)
        //                             t.true(tribeMessage10.success, "node1 should send a message to new bot")
        //                             await h.sleep(5000)
        // const delBot = await f.botDelete(t, node1, newBot.bot.id)
        // console.log("BOT DELETE === ", delBot.bot)
        //                                 //NODE1 SENDS A TESTBOT MESSAGE IN TRIBE
        //                                 const text11 = "/bot uninstall testbot"
        //                                 let tribeMessage11 = await f.sendTribeMessage(t, node1, tribe, text11)
        //                                 t.true(tribeMessage11.success, "node1 should send a message to new bot")
        // const checkBots2 = await f.getBots(t, node1)
        // console.log("CHECK BOTS === ", JSON.stringify(checkBots2))
        // await h.sleep(5000)
        // return
        //NODE2 LEAVES THE TRIBE
        let left = yield del_1.leaveTribe(t, node2, tribe);
        t.true(left, 'node2 should leave tribe');
        //NODE3 LEAVES THE TRIBE
        let left2 = yield del_1.leaveTribe(t, node3, tribe);
        t.true(left2, 'node3 should leave tribe');
        //NODE1 DELETES THE TRIBE
        let delTribe = yield del_1.deleteTribe(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
//# sourceMappingURL=botCreation.test.js.map