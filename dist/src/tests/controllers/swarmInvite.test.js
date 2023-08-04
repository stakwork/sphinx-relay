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
exports.swarmInvite = void 0;
const ava_1 = require("ava");
const invites_1 = require("../utils/invites");
const nodes_1 = require("../nodes");
const helpers_1 = require("../utils/helpers");
/*
npx ava src/tests/controllers/swarmInvite.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield swarmInvite(t, 3, 4, 5);
}));
function swarmInvite(t, index1, index2, index3) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND IMAGES WITHIN A TRIBE ===>
        let node1 = nodes_1.default[index1];
        let node2 = nodes_1.default[index2];
        let node3 = nodes_1.default[index3];
        console.log(`Checking swarm invite for ${node1.alias} and ${node2.alias} and ${node3.alias}`);
        // Create Invite
        const invite = yield (0, invites_1.createInvite)(t, node2);
        t.true(invite.success, 'Invite should be created');
        const paidInvite = yield (0, invites_1.payInvite)(t, node2, invite.contact.invite.invite_string);
        t.true(paidInvite.success, 'Invite should have been paid for');
        yield (0, helpers_1.sleep)(70000);
        const finishedInvite = yield (0, invites_1.getInvite)(t, node2, paidInvite.response.invite.invite_string);
        t.truthy(finishedInvite.response.invite.connection_string, 'Connection string should exist');
    });
}
exports.swarmInvite = swarmInvite;
//# sourceMappingURL=swarmInvite.test.js.map