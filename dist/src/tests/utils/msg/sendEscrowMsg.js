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
exports.sendEscrowMsg = void 0;
const http = require("ava-http");
const rsa_1 = require("../../electronjs/rsa");
const get_1 = require("../get");
const helpers_1 = require("../helpers");
const config_1 = require("../../config");
function sendEscrowMsg(t, node, admin, tribe, text) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE POSTS MESSAGE TO TRIBE ===>
        const escrowAmount = tribe.escrow_amount;
        t.true(escrowAmount != 0, 'escrow amount should not be zero');
        const escrowMillis = tribe.escrow_millis;
        t.true(escrowMillis != 0, 'escrow time should not be zero');
        var pricePerMessage = 0;
        if (tribe.price_per_message)
            pricePerMessage = tribe.price_per_message;
        let nodeContact = yield get_1.getSelf(t, node);
        //encrypt random string with node contact_key
        const encryptedText = rsa_1.encrypt(nodeContact.contact_key, text);
        //encrypt random string with test tribe group_key from node1
        const remoteText = rsa_1.encrypt(tribe.group_key, text);
        const tribeId = yield get_1.getTribeIdFromUUID(t, node, tribe);
        t.truthy(tribeId, 'node should get tribe id');
        //create test tribe message object
        const v = {
            contact_id: null,
            chat_id: tribeId,
            text: encryptedText,
            remote_text_map: { chat: remoteText },
            amount: escrowAmount + pricePerMessage || 0,
            reply_uuid: '',
            boost: false,
        };
        //get balances BEFORE message
        const [nodeBalBefore, adminBalBefore] = yield escrowBalances(t, node, admin);
        //send message from node to test tribe
        const msg = yield http.post(node.external_ip + '/messages', helpers_1.makeArgs(node, v));
        //make sure msg exists
        t.true(msg.success, 'node should send message to tribe');
        const msgUuid = msg.response.uuid;
        t.truthy(msgUuid, 'message uuid should exist');
        //await message to post
        const escrowMsg = yield get_1.getCheckNewMsgs(t, admin, msgUuid);
        t.truthy(escrowMsg, 'should find escrow message posted');
        //get balances DURING escrow
        const [nodeBalDuring, adminBalDuring] = yield escrowBalances(t, node, admin);
        //pause for escrow time
        yield helpers_1.sleep(escrowMillis + 1);
        //get balances AFTER escrow
        const [nodeBalAfter, adminBalAfter] = yield escrowBalances(t, node, admin);
        //ON VOLTAGE NODE:
        //ADMIN LOSES r.allowedFee BETWEEN DURING AND AFTER
        //NODE LOSES r.allowedFee BETWEEN BEFORE AND DURING
        //Check admin balances throughout
        t.true(Math.abs(adminBalBefore + pricePerMessage - adminBalAfter) <=
            config_1.config.allowedFee, 'admin end balance should increase by ppm');
        t.true(Math.abs(adminBalBefore + pricePerMessage + escrowAmount - adminBalDuring) <= config_1.config.allowedFee, 'admin should hold escrowAmount and ppm during escrow');
        t.true(Math.abs(adminBalDuring - escrowAmount - adminBalAfter) <=
            config_1.config.allowedFee, 'admin should lose escrowAmount after escrowMillis');
        //Check node balances throughout
        t.true(Math.abs(nodeBalBefore - pricePerMessage - nodeBalAfter) <=
            config_1.config.allowedFee, 'node end balance should decrease by ppm');
        t.true(Math.abs(nodeBalBefore - pricePerMessage - escrowAmount - nodeBalDuring) <=
            config_1.config.allowedFee, 'node should lose escrowAmount and ppm during escrow');
        t.true(Math.abs(nodeBalDuring + escrowAmount - nodeBalAfter) <= config_1.config.allowedFee, 'node should gain escrowAmount after escrowMillis');
        return { success: true, message: msg.response };
    });
}
exports.sendEscrowMsg = sendEscrowMsg;
function escrowBalances(t, node, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        const adminBal = yield get_1.getBalance(t, admin);
        t.true(typeof adminBal === 'number');
        const nodeBal = yield get_1.getBalance(t, node);
        t.true(typeof nodeBal === 'number');
        return [nodeBal, adminBal];
    });
}
//# sourceMappingURL=sendEscrowMsg.js.map