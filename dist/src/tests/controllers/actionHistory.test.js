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
exports.actionHistory = void 0;
const ava_1 = require("ava");
const nodes_1 = require("../nodes");
const save_1 = require("../utils/save");
const get_1 = require("../utils/get");
/*
npx ava src/tests/controllers/actionHistory.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield actionHistory(t, 0);
}));
function actionHistory(t, index) {
    return __awaiter(this, void 0, void 0, function* () {
        let node = nodes_1.default[index];
        console.log(`Testing Action History for ${node.alias}`);
        const searchTerm = 'search for utxo';
        const saveAction = yield (0, save_1.saveActionHistory)(t, searchTerm, node);
        t.true(saveAction, 'Action needs to be saved on the DB');
        const checkActionHistory = yield (0, get_1.verifyActionHistorySaved)(searchTerm, node);
        t.true(checkActionHistory, 'Search term should be in the database');
    });
}
exports.actionHistory = actionHistory;
//# sourceMappingURL=actionHistory.test.js.map