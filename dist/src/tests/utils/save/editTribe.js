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
exports.editTribe = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
function editTribe(t, node, tribeId, body) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE EDIT THE TRIBE ===>
        console.log('inside edit');
        console.log('body === ', body);
        try {
            const res = yield http.put(node.external_ip + `/group/${tribeId}`, helpers_1.makeArgs(node, body));
            t.true(res.success, 'node should have edited tribe');
            return { success: res.success, tribe: res.response };
        }
        catch (e) {
            console.log('error');
        }
        return { success: false };
    });
}
exports.editTribe = editTribe;
//# sourceMappingURL=editTribe.js.map