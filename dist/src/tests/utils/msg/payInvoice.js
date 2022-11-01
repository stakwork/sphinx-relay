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
const get_1 = require("../get");
const helpers_1 = require("../helpers");
const payInvoice = (t, sendingNode, receivingNode, amount, payment_request) => __awaiter(void 0, void 0, void 0, function* () {
    //PAY INVOICE FROM NODE1 TO NODE2 ===>
    //get sendingNode balance before payment
    const sendingNodebeforeBalance = yield (0, get_1.getBalance)(t, sendingNode);
    //get receivingNode balance before payment
    const receivingNodebeforeBalance = yield (0, get_1.getBalance)(t, receivingNode);
    const v = { payment_request };
    const r = yield http.put(sendingNode.external_ip + '/invoices', (0, helpers_1.makeArgs)(sendingNode, v));
    t.true(r.success, 'Put method should have succeeded');
    const paymentHash = r.response.payment_hash;
    t.truthy(paymentHash, 'paymentHash should exist');
    //wait for PUT method
    const paid = yield (0, get_1.getCheckNewPaidInvoice)(t, receivingNode, paymentHash);
    t.truthy(paid, 'receivingNode should see payment');
    //get sendingNode balance after payment
    const sendingNodeafterBalance = yield (0, get_1.getBalance)(t, sendingNode);
    //get receivingNode balance after payment
    const receivingNodeafterBalance = yield (0, get_1.getBalance)(t, receivingNode);
    console.log('amount', amount);
    console.log('NODE1 === ', sendingNodebeforeBalance - sendingNodeafterBalance);
    console.log('NODE2 === ', receivingNodeafterBalance - receivingNodebeforeBalance);
    //check that sendingNode sent payment and receivingNode received payment based on balances
    //3 SAT ARE ADDED AS A MESSAGE FEE
    t.true(sendingNodebeforeBalance - sendingNodeafterBalance >= amount, 'sendingNode should have paid amount');
    t.true(receivingNodebeforeBalance - receivingNodeafterBalance <= amount - 3, 'receivingNode should have received amount');
    return true;
});
exports.payInvoice = payInvoice;
//# sourceMappingURL=payInvoice.js.map