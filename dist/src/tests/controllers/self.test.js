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
const nodes_1 = require("../nodes");
const get_1 = require("../utils/get");
ava_1.default.serial('checkSelf', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield helpers_1.asyncForEach(nodes_1.default, (node) => __awaiter(void 0, void 0, void 0, function* () {
        if (!node)
            return;
        //get list of contacts as node
        var me = yield get_1.getSelf(t, node);
        //check that the structure object
        t.true(typeof me === 'object'); // json object by default
        //check that first contact public_key === node pubkey
        t.true(me.public_key === node.pubkey, 'pubkey of first contact should be pubkey of node');
        console.log(`${node.alias}: ${me.public_key}`);
    }));
}));
//# sourceMappingURL=self.test.js.map