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
exports.checkTribeMember = void 0;
const index_1 = require("./index");
function checkTribeMember(t, node1, node2, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        const tribeMembers = yield (0, index_1.getTribeMember)(t, node1, tribe.id);
        for (let i = 0; i < tribeMembers.length; i++) {
            let tribeMember = tribeMembers[i];
            if (tribeMember.public_key === node2.pubkey) {
                return true;
            }
        }
        return false;
    });
}
exports.checkTribeMember = checkTribeMember;
//# sourceMappingURL=checkTribeMember.js.map