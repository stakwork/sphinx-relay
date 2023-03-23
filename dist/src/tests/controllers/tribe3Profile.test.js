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
const helpers_1 = require("../utils/helpers");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
const get_1 = require("../utils/get");
const msg_1 = require("../utils/msg");
const nodes_1 = require("../nodes");
/*
npx ava src/tests/controllers/tribe3Profile.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test-14-tribe3Profile: create tribe, two nodes join tribe, change alias and profile pic, check change, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield tribe3Profile(t, nodes_1.default[0], nodes_1.default[1], nodes_1.default[2]);
}));
function tribe3Profile(t, node1, node2, node3) {
    return __awaiter(this, void 0, void 0, function* () {
        //THREE NODES EDIT AND CHECK PROFILE PICS AND ALIAS ===>
        t.truthy(node3, 'this test requires three nodes');
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
        //GET NODE1 PROFILE INFO
        const oldSelf = yield (0, get_1.getSelf)(t, node1);
        console.log('OOOLD SELF === ', oldSelf);
        var oldName = oldSelf.alias;
        var oldPic = oldSelf.photo_url || '';
        //NODE1 SENDS A TEXT MESSAGE IN TRIBE
        const text = (0, helpers_1.randomText)();
        let tribeMessage = yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text);
        //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n2check = yield (0, msg_1.checkMessageDecryption)(t, node2, tribeMessage.uuid, text);
        t.true(n2check, 'node2 should have read and decrypted node1 message');
        const lastMsg = yield (0, get_1.getCheckNewMsgs)(t, node2, tribeMessage.uuid);
        console.log('oldName === ', oldName);
        console.log('lastMsg.sender_alias === ', oldName);
        console.log('oldPic === ', oldPic);
        console.log('lastMsg.sender_pic === ', oldName);
        t.true(lastMsg.sender_alias === oldName, 'message alias should equal node1 old name');
        t.true(lastMsg.sender_pic === oldPic, 'message profile pic should equal node1 old pic');
        //NODE1 CHANGES PROFILE ALIAS
        const newName = 'New Name 1';
        const newAlias = { alias: newName };
        const change1 = yield (0, save_1.updateProfile)(t, node1, newAlias);
        t.true(change1, 'node1 should have changed its alias');
        //NODE1 CHANGES PROFILE PIC URL
        const newPic = '//imgur.com/a/axsiHTi';
        // const newPic = ''
        const newPhotoUrl = { photo_url: newPic };
        const change2 = yield (0, save_1.updateProfile)(t, node1, newPhotoUrl);
        t.true(change2, 'node1 should have changed its profile pic');
        //NODE1 SENDS A TEXT MESSAGE IN TRIBE
        const text2 = (0, helpers_1.randomText)();
        let tribeMessage2 = yield (0, msg_1.sendTribeMessage)(t, node1, tribe, text2);
        //CHECK THAT NODE1'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n2check2 = yield (0, msg_1.checkMessageDecryption)(t, node2, tribeMessage2.uuid, text2);
        t.true(n2check2, 'node2 should have read and decrypted node1 message');
        const lastMsg2 = yield (0, get_1.getCheckNewMsgs)(t, node2, tribeMessage2.uuid);
        t.true(lastMsg2.sender_alias === newName, 'message alias should equal node1 new name');
        t.true(lastMsg2.sender_pic === newPic, 'message profile pic should equal node1 new pic');
        //RESET NODE1 PROFILE
        const oldAlias = { alias: oldName };
        let reset1 = yield (0, save_1.updateProfile)(t, node1, oldAlias);
        t.true(reset1, 'node1 should have reset its old alias');
        const oldPhotoUrl = { photo_url: oldPic };
        let reset2 = yield (0, save_1.updateProfile)(t, node1, oldPhotoUrl);
        t.true(reset2, 'node1 should have reset its old profile pic');
        //GET NODE2 PROFILE INFO
        const oldSelf2 = yield (0, get_1.getSelf)(t, node2);
        var oldName2 = oldSelf2.alias;
        var oldPic2 = oldSelf2.photo_url || '';
        //NODE2 SENDS A TEXT MESSAGE IN TRIBE
        const text3 = (0, helpers_1.randomText)();
        let tribeMessage3 = yield (0, msg_1.sendTribeMessage)(t, node2, tribe, text3);
        //NODE1 CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n1check = yield (0, msg_1.checkMessageDecryption)(t, node1, tribeMessage3.uuid, text3);
        t.true(n1check, 'node1 should have read and decrypted node2 message');
        const lastMsg3 = yield (0, get_1.getCheckNewMsgs)(t, node1, tribeMessage3.uuid);
        t.true(lastMsg3.sender_alias === oldName2, 'message alias should equal node2 old name');
        t.true(lastMsg3.sender_pic === oldPic2, 'message profile pic should equal node2 old pic');
        //NODE3 CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n3check = yield (0, msg_1.checkMessageDecryption)(t, node3, tribeMessage3.uuid, text3);
        t.true(n3check, 'node3 should have read and decrypted node2 message');
        const lastMsg4 = yield (0, get_1.getCheckNewMsgs)(t, node3, tribeMessage3.uuid);
        t.true(lastMsg4.sender_alias === oldName2, 'message alias should equal node2 old name');
        t.true(lastMsg4.sender_pic === oldPic2, 'message profile pic should equal node2 old pic');
        //NODE2 CHANGES PROFILE ALIAS
        const newName2 = 'New Name 2';
        const newAlias2 = { alias: newName2 };
        const change3 = yield (0, save_1.updateProfile)(t, node2, newAlias2);
        t.true(change3, 'node2 should have changed its alias');
        //NODE2 CHANGES PROFILE PIC URL
        let change4 = yield (0, save_1.updateProfile)(t, node2, newPhotoUrl);
        t.true(change4, 'node2 should have changed its profile pic');
        //NODE2 SENDS A TEXT MESSAGE IN TRIBE
        const text4 = (0, helpers_1.randomText)();
        let tribeMessage4 = yield (0, msg_1.sendTribeMessage)(t, node2, tribe, text4);
        //NODE1 CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n1check2 = yield (0, msg_1.checkMessageDecryption)(t, node1, tribeMessage4.uuid, text4);
        t.true(n1check2, 'node1 should have read and decrypted node2 message');
        const lastMsg5 = yield (0, get_1.getCheckNewMsgs)(t, node1, tribeMessage4.uuid);
        t.true(lastMsg5.sender_alias === newName2, 'message alias should equal node2 new name');
        t.true(lastMsg5.sender_pic === newPic, 'message profile pic should equal node2 new pic');
        //NODE3 CHECK THAT NODE2'S DECRYPTED MESSAGE IS SAME AS INPUT
        const n3check2 = yield (0, msg_1.checkMessageDecryption)(t, node3, tribeMessage4.uuid, text4);
        t.true(n3check2, 'node3 should have read and decrypted node2 message');
        const lastMsg6 = yield (0, get_1.getCheckNewMsgs)(t, node3, tribeMessage4.uuid);
        t.true(lastMsg6.sender_alias === newName2, 'message alias should equal node2 new name');
        t.true(lastMsg6.sender_pic === newPic, 'message profile pic should equal node2 new pic');
        //RESET NODE2 PROFILE
        const oldAlias2 = { alias: oldName2 };
        let reset3 = yield (0, save_1.updateProfile)(t, node2, oldAlias2);
        t.true(reset3, 'node2 should have reset its old alias');
        const oldPhotoUrl2 = { photo_url: oldPic2 };
        let reset4 = yield (0, save_1.updateProfile)(t, node2, oldPhotoUrl2);
        t.true(reset4, 'node2 should have reset its old profile pic');
        //NODE2 LEAVES THE TRIBE
        let n2left = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(n2left, 'node2 should leave tribe');
        //NODE3 LEAVES THE TRIBE
        let n3left = yield (0, del_1.leaveTribe)(t, node3, tribe);
        t.true(n3left, 'node3 should leave tribe');
        //NODE1 DELETES THE TRIBE
        let delTribe = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
//# sourceMappingURL=tribe3Profile.test.js.map