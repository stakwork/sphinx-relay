"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decode_1 = require("../../utils/decode");
describe('Testing the payment request decode function', () => {
    test('Decode invoice request', () => {
        expect((0, decode_1.decodePaymentRequest)('lnbcrt3u1pjtsdunpp5nx3ehry9myrqyv8qwl2lcwkm7g99unszp05cvdwaujt7h6rr7gpqdqqcqzzsxqyz5vqsp5q4q99kf82kz9a5x5szvtlkupzz6ljhwujtv4s0zf2tdh4elzunas9qyyssqkw6c4sa66cc2xrl09lpwfd9uusknr0999fdyfh9axlq48h9rwy59fu8m65pfjqvadr4ny5qqagv5wc25zw5lpczkfu9llz9ggcwuf0sqdsje0r')).toStrictEqual({
            sat: 300,
            msat: 300000,
            paymentHash: '99a39b8c85d9060230e077d5fc3adbf20a5e4e020be98635dde497ebe863f202',
            invoiceDate: 1689794451000,
            expirationSeconds: 86400000,
            memo: '',
        });
    });
});
//# sourceMappingURL=decode_payment_req.test.js.map