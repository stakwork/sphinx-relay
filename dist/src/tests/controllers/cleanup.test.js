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
const get_1 = require("../utils/get");
const del_1 = require("../utils/del");
const helpers_1 = require("../utils/helpers");
ava_1.default.serial('cleanup contacts', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield helpers_1.asyncForEach(nodes_1.default, (node1) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('=> cleanup contacts', node1.alias);
        const allContacts = yield get_1.getContacts(t, node1);
        for (const contact of allContacts) {
            if (contact.public_key !== node1.pubkey) {
                const ok = yield del_1.deleteContact(t, node1, contact.id);
                t.true(ok);
            }
        }
    }));
}));
ava_1.default.serial('cleanup chats', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield helpers_1.asyncForEach(nodes_1.default, (node1) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('=> cleanup chats', node1.alias);
        const allChats = yield get_1.getChats(t, node1);
        for (const chat of allChats) {
            const ok = yield del_1.deleteChat(t, node1, chat.id);
            t.true(ok);
        }
    }));
}));
//# sourceMappingURL=cleanup.test.js.map