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
const models_1 = require("../models");
const payTagger = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.owner)
        return (0, res_1.failure)(res, 'no owner');
    const { amount, destination, ref_id, timestamp } = req.body;
    if (typeof amount !== 'number' &&
        typeof destination !== 'string' &&
        typeof ref_id !== 'string' &&
        typeof timestamp !== 'string')
        return (0, res_1.failure)(res, 'Invalid data provided');
    const tenant = req.owner.id;
    try {
        yield Lightning.keysend({
            amt: amount,
            dest: destination,
        });
        yield models_1.models.Tagger.create({
            tenant,
            amount,
            pubkey: destination,
            type: 'stream',
            refId: ref_id,
            timestamp,
            status: 1,
        });
        return (0, res_1.success)(res, 'Payment Successful');
    }
    catch (e) {
        console.log(e);
        yield models_1.models.Tagger.create({
            tenant,
            amount,
            pubkey: destination,
            type: 'stream',
            refId: ref_id,
            timestamp,
            status: 0,
        });
        return (0, res_1.failure)(res, 'An error occured');
    }
});
exports.payTagger = payTagger;
//# sourceMappingURL=taggers.js.map