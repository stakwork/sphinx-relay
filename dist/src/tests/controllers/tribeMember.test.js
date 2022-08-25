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
const nodes_1 = require("../nodes");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const msg_1 = require("../utils/msg");
const http = require("ava-http");
const helpers_1 = require("../utils/helpers");
ava_1.default.serial('tribeMember', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield tribeMemberTest(t, nodes_1.default[0], nodes_1.default[1]);
}));
function tribeMemberTest(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        console.log('tribe created');
        let body = Object.assign(Object.assign({}, man), { chat_id: tribe.id });
        // const body = {
        //   chat_id: tribe.id,
        //   pub_key: node2.pubkey,
        //   photo_url: '',
        //   route_hint: node2.routeHint || '',
        //   alias: node2.alias,
        //   contact_key: node2.contact_key,
        // }
        //node1 creates new tribe
        let member = yield http.post(node1.external_ip + '/tribe_member', (0, helpers_1.makeArgs)(node1, body));
        console.log('member', member);
        //check that new tribe was created successfully
        t.true(member.success, 'member should be successful');
        yield (0, msg_1.sendTribeMessage)(t, node1, tribe, 'hello');
        console.log('msg sent');
        //NODE1 DELETES THE TRIBE
        let delTribe = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
const man = {
    pub_key: '02b98a7fb8cc007048625b6446ad49a1b3a722df8c1ca975b87160023e14d19097',
    photo_url: '',
    route_hint: '',
    alias: 'cache',
    contact_key: 'MIIBCgKCAQEAwjAo9bayiHCLnKjsaUOtMf3RigRPsOdipoV76LTAgfcS8gHxaBizVtSfK7lMZSqjqYgm+4/f1IjYFHNGemeGLoPPcmaZGAk5F/3lIuiZuT1lyRv0by/J3B+cjmvH7DLPPhh4fK+GagNbBxQmSjwCLNyXZWp515NSG7OW0+PtFmBlZROB+EBvyEz8DFeWoBYNJG3PbVBL1/BkRjrL/J2NYAFGvqvmDeYXqpd2ot0zzSRTzZsS3fZceu7hopPM55zG3YffOUpMBDjR7Y+bZLFWqamSV13dwa/eTXZlvD2Fs5qszOOyPAv2jEfjYM3e9sR+m4qLLHqAVoWx8jDmqf1OdQIDAQAB',
};
//# sourceMappingURL=tribeMember.test.js.map