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
exports.createInvite = void 0;
const http = require("ava-http");
const helpers_1 = require("../../utils/helpers");
function createInvite(t, node1) {
    return __awaiter(this, void 0, void 0, function* () {
        //create invite object
        try {
            const v = {
                nickname: 'new user',
                welcome_message: 'welcome to sphinx',
            };
            //post invite
            const r = yield http.post(node1.external_ip + '/invites', (0, helpers_1.makeArgs)(node1, v));
            t.true(r.success, 'invites should have been created');
            return r;
        }
        catch (error) {
            return error.error;
        }
    });
}
exports.createInvite = createInvite;
//# sourceMappingURL=createInvite.js.map