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
exports.getTribeByUuid = void 0;
const http = require("ava-http");
const config_1 = require("../../config");
function getTribeByUuid(t, tribe) {
    return __awaiter(this, void 0, void 0, function* () {
        //GET TRIBE FROM TRIBES SERVER BY UUID
        const res = yield http.get('http://' + config_1.config.tribeHost + `/tribes/${tribe.uuid}`);
        t.truthy(res, 'should get tribe by UUID from tribe host server');
        return res;
    });
}
exports.getTribeByUuid = getTribeByUuid;
//# sourceMappingURL=getTribeByUuid.js.map