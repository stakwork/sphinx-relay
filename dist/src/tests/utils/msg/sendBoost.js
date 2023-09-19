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
exports.boostAsMessage = exports.sendBoost = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const config_1 = require("../../config");
const get_1 = require("../get");
function sendBoost(t, node1, node2, replyMessage, amount, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 SENDS TEXT MESSAGE BOOST TO NODE2
        //get balances of both nodes before boost
        const [boosterBalBefore, boosteeBalBefore] = yield boostBalances(t, node1, node2);
        //make sure that node2's message exists from node1 perspective
        const msgExists = yield (0, get_1.getCheckNewMsgs)(t, node1, replyMessage.uuid);
        t.truthy(msgExists, 'message being replied to should exist');
        const msg = yield boostAsMessage(t, tribe, node1, replyMessage, amount);
        //wait for boost message to process
        const msgUuid = msg.response.uuid;
        t.truthy(msgUuid, 'msg uuid should exist');
        const lastMessage = yield (0, get_1.getCheckNewMsgs)(t, node2, msgUuid);
        t.truthy(lastMessage, 'await message post');
        //get balances of both nodes before boost
        const [boosterBalAfter, boosteeBalAfter] = yield boostBalances(t, node1, node2);
        // check that node1 sent payment and node2 received payment based on balances
        t.true(Math.abs(boosterBalBefore - boosterBalAfter - amount) <= config_1.config.allowedFee, 'booster should have lost amount');
        t.true(Math.abs(boosteeBalAfter - boosteeBalBefore - amount) <= config_1.config.allowedFee, 'boostee should have gained amount');
        return { success: true, message: msg.response };
    });
}
exports.sendBoost = sendBoost;
function boostBalances(t, booster, boostee) {
    return __awaiter(this, void 0, void 0, function* () {
        const boosterBal = yield (0, get_1.getBalance)(t, booster);
        t.true(typeof boosterBal === 'number');
        const boosteeBal = yield (0, get_1.getBalance)(t, boostee);
        t.true(typeof boosteeBal === 'number');
        return [boosterBal, boosteeBal];
    });
}
function boostAsMessage(t, tribe, node, replyMessage, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        //get uuid from node2's message
        const replyUuid = replyMessage.uuid;
        t.truthy(replyUuid, 'replyUuid should exist');
        //get tribeId from node1 perspective
        const tribeId = yield (0, get_1.getTribeIdFromUUID)(t, node, tribe);
        t.truthy(tribeId, 'tribeId should exist');
        //create boost message object for node2's message which is represented by replyUuid
        const v = {
            boost: true,
            contact_id: null,
            text: '',
            chat_id: tribeId,
            reply_uuid: replyUuid,
            amount: amount,
            message_price: 0,
        };
        //node1 sends a boost on node2's message
        try {
            const msg = yield http.post(node.external_ip + '/messages', (0, helpers_1.makeArgs)(node, v));
            t.true(msg.success, 'msg should exist');
            return msg;
        }
        catch (error) {
            return error.error;
        }
    });
}
exports.boostAsMessage = boostAsMessage;
//# sourceMappingURL=sendBoost.js.map