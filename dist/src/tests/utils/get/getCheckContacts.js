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
exports.getCheckContacts = void 0;
const get_1 = require("../get");
function getCheckContacts(t, node1, node2) {
    return new Promise((resolve, reject) => {
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(0, t, node1, node2, resolve, reject);
        }), 1000);
    });
}
exports.getCheckContacts = getCheckContacts;
function timeout(i, t, node1, node2, resolve, reject) {
    return __awaiter(this, void 0, void 0, function* () {
        const [node1contact, node2contact] = yield get_1.getContacts(t, node1, node2);
        if (node1contact.contact_key && node2contact.contact_key) {
            return resolve([node1contact, node2contact]);
        }
        if (i > 10) {
            return reject('failed to getCheckContacts');
        }
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            timeout(i + 1, t, node1, node2, resolve, reject);
        }), 1000);
    });
}
//# sourceMappingURL=getCheckContacts.js.map