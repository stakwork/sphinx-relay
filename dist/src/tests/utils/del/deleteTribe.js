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
exports.deleteTribe = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const get_1 = require("../get");
function deleteTribe(t, node, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        const tribeId = yield (0, get_1.getTribeIdFromUUID)(t, node, tribe);
        t.truthy(tribeId, 'node should get tribe id');
        //node deletes the tribe
        let del = yield http.del(node.ip + '/chat/' + tribeId, (0, helpers_1.makeArgs)(node));
        t.true(del.success, 'node1 should delete the tribe');
        return true;
    });
}
exports.deleteTribe = deleteTribe;
//# sourceMappingURL=deleteTribe.js.map