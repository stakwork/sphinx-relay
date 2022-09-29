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
exports.payTagger = void 0;
const res_1 = require("../utils/res");
const Lightning = require("../grpc/lightning");
const payTagger = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const { amount, destination } = req.body;
    if (typeof amount !== 'number' && typeof destination !== 'string')
        return (0, res_1.failure)(res, 'Invalid data provided');
    try {
        const keysendPayment = yield Lightning.keysend({
            amt: 5,
            dest: destination,
        });
        console.log(keysendPayment);
        return (0, res_1.success)(res, keysendPayment);
    }
    catch (e) {
        console.log(e);
        return (0, res_1.failure)(res, 'An error occured');
    }
});
exports.payTagger = payTagger;
//# sourceMappingURL=taggers.js.map