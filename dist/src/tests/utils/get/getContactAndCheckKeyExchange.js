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
exports.getContactAndCheckKeyExchange = void 0;
const getContacts_1 = require("./getContacts");
function getContactAndCheckKeyExchange(t, node1, node2) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            timeout(1, t, node1, node2, resolve, reject);
        }, 1000);
    });
}
exports.getContactAndCheckKeyExchange = getContactAndCheckKeyExchange;
function timeout(i, t, node1, node2, resolve, reject) {
    return __awaiter(this, void 0, void 0, function* () {
        const [node1contact, node2contact] = yield getContacts_1.getContacts(t, node1, node2);
        if (node1contact.contact_key && node2contact.contact_key) {
            return resolve([node1contact, node2contact]);
        }
        if (i >= 15) {
            return reject('failed to getContactAndCheckKeyExchange');
        }
        setTimeout(() => {
            timeout(i + 1, t, node1, node2, resolve, reject);
        }, 1000);
    });
}
//# sourceMappingURL=getContactAndCheckKeyExchange.js.map