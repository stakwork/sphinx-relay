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
    yield helpers.iterate(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield yield invoices(t, node1, node2);
    }));
}));
function invoices(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Checking invoices for ${node1.alias} and ${node2.alias}`);
        console.log(`${node1.alias} generating invoice to be paid by ${node2.alias}`);
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
        yield helpers.sleep(1000);
        //Node2 pays the invoice
        const paidInvoice = yield (0, invoices_1.payInvoice)(t, node2, paymentRequest);
        t.true(paidInvoice.success, 'Invoice should have been paid');
        yield helpers.sleep(1000);
        //Get Invoice details again to confirm invoice was paid
        const invoiceDetail2 = yield (0, invoices_1.getInvoice)(t, node1, paymentRequest);
        const invoicePaymentStatus = invoiceDetail2.response.settled;
        t.true(invoicePaymentStatus, `Payment should have been made by ${node2.alias} to ${node1.alias}`);
        console.log(`${node2.alias} generating invoice to be paid by ${node1.alias}`);
        //Create an Invoice by node 2
        yield helpers.sleep(1000);
        const createdInvoice2 = yield (0, invoices_1.createInvoice)(t, node2, 12, 'test invoice');
        if (node1.alias === 'alice' && node2.alias === 'virtualNode0') {
            console.log(createdInvoice2);
        }
        const paymentRequest2 = createdInvoice2.response.invoice;
        t.truthy(paymentRequest2, 'Payment request should have been created');
        //Get Invoice details by node 2
        const invoiceDetail3 = yield (0, invoices_1.getInvoice)(t, node2, paymentRequest2);
        const invoicePaymentRequest2 = invoiceDetail3.response.payment_request;
        t.truthy(invoicePaymentRequest2, `Payment request should exist for ${node2.alias} when testing with ${node1.alias}`);
        //Payment request gotten from getInvoice should equal payment request from create invoice
        t.true(paymentRequest2 === invoicePaymentRequest2, 'Payment request gotten from getInvoice should equal payment request from create invoice');
        yield helpers.sleep(1000);
        //Node2 pays the invoice
        const paidInvoice2 = yield (0, invoices_1.payInvoice)(t, node1, paymentRequest2);
        t.true(paidInvoice2.success, 'Invoice should have been paid');
        yield helpers.sleep(1000);
        //Get Invoice details again to confirm invoice was paid
        const invoiceDetail4 = yield (0, invoices_1.getInvoice)(t, node2, paymentRequest2);
        const invoicePaymentStatus2 = invoiceDetail4.response.settled;
        t.true(invoicePaymentStatus2, `Payment should have been made by ${node2.alias} to ${node1.alias}`);
    });
}
//# sourceMappingURL=invoices.test.js.map