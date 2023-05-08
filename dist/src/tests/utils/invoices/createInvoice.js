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
exports.createInvoice = void 0;
const http = require("ava-http");
const helpers_1 = require("../../utils/helpers");
function createInvoice(t, node1, amount, text) {
    return __awaiter(this, void 0, void 0, function* () {
        //create payment object
        const v = {
            contact_id: null,
            chat_id: null,
            amount: amount,
            text,
        };
        //post payment from node1 to node2
        const r = yield http.post(node1.external_ip + '/invoices', (0, helpers_1.makeArgs)(node1, v));
        t.true(r.success, 'invoice should have been posted');
        return r;
    });
}
exports.createInvoice = createInvoice;
//# sourceMappingURL=createInvoice.js.map