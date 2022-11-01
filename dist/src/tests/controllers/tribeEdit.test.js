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
const save_1 = require("../utils/save");
const helpers_1 = require("../utils/helpers");
const get_1 = require("../utils/get");
const nodes_1 = require("../nodes");
ava_1.default.serial('tribeEdit', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield helpers_1.iterate(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield tribeEdit(t, node1, node2);
    }));
}));
function tribeEdit(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //A NODE MAKES EDITS TO A TRIBE IT CREATED ===>
        console.log(`${node1.alias} and ${node2.alias}`);
        //NODE1 CREATES A TRIBE
        console.log('create tribe');
        let tribe = yield save_1.createTribe(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        console.log('join tribe');
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield save_1.joinTribe(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //GET TRIBE ID FROM NODE1 PERSPECTIVE
        console.log('get id');
        const tribeId = yield get_1.getTribeId(t, node1, tribe);
        t.true(typeof tribeId === 'number');
        //CREATE TRIBE BODY WITH EDITED PRICE_TO_JOIN
        const newPriceToJoin = 12;
        const newDescription = 'Edited Description';
        const body = {
            name: tribe.name || 0,
            price_per_message: tribe.price_per_message || 0,
            price_to_join: newPriceToJoin,
            escrow_amount: tribe.escrow_amount || 0,
            escrow_millis: tribe.escrow_millis || 0,
            img: tribe.img || '',
            description: newDescription,
            tags: [],
            unlisted: true,
            app_url: '',
            feed_url: '',
        };
        //USE TRIBE ID AND EDITED BODY TO EDIT THE TRIBE
        console.log('edit tribe');
        const edit = yield save_1.editTribe(t, node1, tribeId, body);
        t.true(edit.success, 'edit should have succeeded');
        t.true(edit.tribe.price_to_join === newPriceToJoin, 'new price to join should be included in edit');
        //GET ALL CHATS FROM NODE1 PERSPECTIVE
        console.log('get chats');
        const node1Chats = yield get_1.getChats(t, node1);
        const editedTribe = yield node1Chats.find((c) => c.id === tribeId);
        t.truthy(editedTribe, 'tribe should be listed in node1 chats');
        t.true((editedTribe === null || editedTribe === void 0 ? void 0 : editedTribe.price_to_join) === newPriceToJoin, 'fetched chat should show edit');
        //FETCH TRIBE FROM TRIBE SERVER TO CHECK EDITS
        console.log('fetch tribe');
        const tribeFetch = yield get_1.getTribeByUuid(t, tribe);
        t.true(typeof tribeFetch === 'object', 'fetched tribe object should exist');
        t.true(tribeFetch.price_to_join === newPriceToJoin, 'tribe server should show new price');
        t.true(tribeFetch.description === newDescription, 'tribe server should show new description');
        //NODE2 LEAVES THE TRIBE
        console.log('leave tribe');
        let left = yield del_1.leaveTribe(t, node2, tribe);
        t.true(left, 'node2 should leave tribe');
        //NODE1 DELETES THE TRIBE
        console.log('delete tribe');
        let delTribe = yield del_1.deleteTribe(t, node1, tribe);
        t.true(delTribe, 'node1 should delete tribe');
    });
}
//# sourceMappingURL=tribeEdit.test.js.map