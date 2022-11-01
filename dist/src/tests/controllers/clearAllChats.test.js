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
const get_1 = require("../utils/get");
const nodes_1 = require("../nodes");
/*
npx ava test-99-clearAllChats.js --verbose --serial --timeout=2m
*/
ava_1.default('test-99-clearAllChats: clear all chats from nodes', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield clearAllChats(t);
}));
function clearAllChats(t) {
    return __awaiter(this, void 0, void 0, function* () {
        //DELETE ALL CHATS ===>
        yield helpers_1.asyncForEach(nodes_1.default, (node) => __awaiter(this, void 0, void 0, function* () {
            if (!node)
                return;
            //get all chats from node
            const chats = yield get_1.getChats(t, node);
            t.truthy(chats, 'should have fetched chats');
            if (chats.length === 0) {
                console.log(`${node.alias} had no chats`);
                return;
            }
            //delete any chat that node is a part of
            yield helpers_1.asyncForEach(chats, (c) => __awaiter(this, void 0, void 0, function* () {
                const deletion = yield del_1.deleteChat(t, node, c);
                t.true(deletion, 'node should delete chat');
            }));
            console.log(`${node.alias} deleted all chats`);
        }));
        return true;
    });
}
//# sourceMappingURL=clearAllChats.test.js.map