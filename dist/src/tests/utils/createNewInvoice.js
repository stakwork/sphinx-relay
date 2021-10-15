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
exports.createNewInvoice = void 0;
const http = require("ava-http");
const helpers_1 = require("./helpers");
const createNewInvoice = (t, receivingNode, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const r = yield http.post(receivingNode.external_ip + '/invoices', (0, helpers_1.makeArgs)(receivingNode, {
        amount,
    }));
    t.true(r.success, 'invoice should have been posted');
    t.truthy(r.response.invoice, 'payment_request should have been included in response');
    return r.response;
});
exports.createNewInvoice = createNewInvoice;
//# sourceMappingURL=createNewInvoice.js.map