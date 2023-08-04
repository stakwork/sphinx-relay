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
exports.payInvite = void 0;
const http = require("ava-http");
const helpers_1 = require("../../utils/helpers");
function payInvite(t, node1, invite_string) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //pay for invite created
            const r = yield http.post(`${node1.external_ip}/invites/${invite_string}/pay`, (0, helpers_1.makeArgs)(node1));
            t.true(r.success, 'invites invoice should have been payed');
            return r;
        }
        catch (error) {
            return error.error;
        }
    });
}
exports.payInvite = payInvite;
//# sourceMappingURL=payInvite.js.map