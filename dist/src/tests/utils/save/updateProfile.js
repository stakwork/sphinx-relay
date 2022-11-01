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
exports.updateProfile = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const get_1 = require("../get");
function updateProfile(t, node, profileUpdate) {
    return __awaiter(this, void 0, void 0, function* () {
        //NODE UPDATES ITS PROFILE
        const self = yield get_1.getSelf(t, node);
        t.truthy(self, 'own contact should be fetched');
        const nodeId = self.id;
        t.truthy(nodeId, 'node should have found id for itself');
        const add = yield http.put(node.external_ip + `/contacts/${nodeId}`, helpers_1.makeArgs(node, profileUpdate));
        t.truthy(add, 'node should have updated its profile');
        return true;
    });
}
exports.updateProfile = updateProfile;
//# sourceMappingURL=updateProfile.js.map