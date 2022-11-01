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
exports.appRejMember = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
function appRejMember(t, admin, contactID, msgId, status) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE1 APPROVE OR REJECT NODE2 ===>
        //status === "approved" or "rejected"
        //contactID === member awaiting approval
        //msgId === join message id
        const appRej = yield http.put(admin.external_ip + `/member/${contactID}/${status}/${msgId}`, (0, helpers_1.makeArgs)(admin));
        t.truthy(appRej);
        // console.log("APPREJ === ", JSON.stringify(appRej))
        return true;
    });
}
exports.appRejMember = appRejMember;
//# sourceMappingURL=appRejMember.js.map