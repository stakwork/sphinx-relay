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
exports.payInvoice = void 0;
const http = require("ava-http");
const helpers_1 = require("../../utils/helpers");
function payInvoice(t, node, payment_request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const v = { payment_request };
            const r = yield http.put(node.external_ip + '/invoices', (0, helpers_1.makeArgs)(node, v));
            t.true(r.success, 'Put method should have succeeded');
            return r;
        }
        catch (error) {
            return error.error;
        }
    });
}
exports.payInvoice = payInvoice;
//# sourceMappingURL=payInvoice.js.map