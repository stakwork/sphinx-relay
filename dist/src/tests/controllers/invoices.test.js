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
const ava_1 = require("ava");
const invoices_1 = require("../utils/invoices");
const nodes_1 = require("../nodes");
const helpers = require("../utils/helpers");
/*
  npx ava src/tests/controllers/invoices.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test invoices: create invoice, get invoice details, pay invoice, check invoice payment status', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield invoices(t, 0, 1, 2);
}));
function invoices(t, index1, index2, index3) {
    return __awaiter(this, void 0, void 0, function* () {
        let node1 = nodes_1.default[index1];
        let node2 = nodes_1.default[index2];
        console.log(`Checking invoices for ${node1.alias} and ${node2.alias}`);
        //Create an Invoice
        const createdInvoice = yield (0, invoices_1.createInvoice)(t, node1, 12, 'test invoice');
        const paymentRequest = createdInvoice.response.invoice;
        t.truthy(paymentRequest, 'Payment request should have been created');
        //Get Invoice details
        const invoiceDetail = yield (0, invoices_1.getInvoice)(t, node1, paymentRequest);
        const invoicePaymentRequest = invoiceDetail.response.payment_request;
        t.truthy(invoicePaymentRequest, 'Payment request should exist');
        //Payment request gotten from getInvoice should equal payment request from create invoice
        t.true(paymentRequest === invoicePaymentRequest, 'Payment request gotten from getInvoice should equal payment request from create invoice');
        //Node2 pays the invoice
        const paidInvoice = yield (0, invoices_1.payInvoice)(t, node2, paymentRequest);
        t.true(paidInvoice.success, 'Invoice should have been paid');
        yield helpers.sleep(1000);
        //Get Invoice details again to confirm invoice was paid
        const invoiceDetail2 = yield (0, invoices_1.getInvoice)(t, node1, paymentRequest);
        const invoicePaymentStatus = invoiceDetail2.response.settled;
        t.true(invoicePaymentStatus, 'Payment should have been made');
    });
}
//# sourceMappingURL=invoices.test.js.map