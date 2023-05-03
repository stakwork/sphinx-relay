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
exports.getInvoice = void 0;
const http = require("ava-http");
const helpers_1 = require("../../utils/helpers");
function getInvoice(t, node1, payment_request) {
    return __awaiter(this, void 0, void 0, function* () {
        //post payment from node1 to node2
        const r = yield http.get(`${node1.external_ip}/invoice?payment_request=${payment_request}`, (0, helpers_1.makeArgs)(node1));
        t.true(r.success, 'invoice should exist');
        return r;
    });
}
exports.getInvoice = getInvoice;
//# sourceMappingURL=getInvoice.js.map