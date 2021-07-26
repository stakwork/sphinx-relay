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
exports.deleteLsat = exports.updateLsat = exports.listLsats = exports.getLsat = exports.saveLsat = exports.payForLsat = void 0;
const lsat_js_1 = require("lsat-js");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const res_1 = require("../utils/res");
const Lightning = require("../grpc/lightning");
const lsatResponseAttributes = [
    'macaroon',
    'paymentRequest',
    'paths',
    'preimage',
    'issuer',
    'metadata',
];
function payForLsat(paymentRequest) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!paymentRequest) {
            if (logger_1.logging.Lightning)
                console.log('[pay invoice] "payment_request" is empty');
            return;
        }
        console.log(`[pay invoice] ${paymentRequest}`);
        const response = yield Lightning.sendPayment(paymentRequest);
        console.log('[pay invoice data]', response);
        // TODO: confirm there is a response.payment_preimage
        return response.payment_preimage;
    });
}
exports.payForLsat = payForLsat;
function saveLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        if (logger_1.logging.Express)
            console.log(`=> saveLsat`);
        const { paymentRequest, macaroon, issuer, paths, metadata } = req.body;
        if (!paymentRequest || !macaroon || !issuer) {
            return res_1.failure(res, 'Missing required LSAT data');
        }
        let lsat;
        try {
            lsat = lsat_js_1.Lsat.fromMacaron(macaroon, paymentRequest);
        }
        catch (e) {
            if (logger_1.logging.Lsat) {
                console.error('[save lsat] Problem getting Lsat:', e.message);
            }
            res.status(400);
            return res.json({ success: false, error: 'invalid lsat macaroon' });
        }
        const lsatIdentifier = lsat.id;
        const preimage = yield payForLsat(paymentRequest);
        if (!preimage) {
            res.status(400);
            return res.json({ success: false, error: 'invoice could not be paid' });
        }
        try {
            lsat.setPreimage(preimage.toString('hex'));
            yield models_1.models.Lsat.create({
                lsatIdentifier,
                paymentRequest,
                preimage,
                issuer,
                paths,
                metadata,
                tenant,
            });
            return res_1.success(res, { success: true, response: { lsat: lsat.toToken() } });
        }
        catch (e) {
            return res_1.failure(res, `failed to save lsat: ${e.message || e}`);
        }
    });
}
exports.saveLsat = saveLsat;
function getLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        const lsatIdentifier = req.params.identifer;
        if (logger_1.logging.Express)
            console.log(`=> getLsat`);
        try {
            const lsat = yield models_1.models.Lsat.findOne({
                where: { tenant, lsatIdentifier },
                attributes: lsatResponseAttributes,
            });
            return res_1.success(res, {
                success: true,
                response: lsat,
            });
        }
        catch (e) {
            return res_1.failure(res, `could not retrieve lsat of id ${lsatIdentifier}`);
        }
    });
}
exports.getLsat = getLsat;
function listLsats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        if (logger_1.logging.Express)
            console.log(`=> listLsats`);
        try {
            const lsats = yield models_1.models.Lsat.findAll({
                where: { tenant },
                attributes: lsatResponseAttributes,
            });
            return res_1.success(res, {
                success: true,
                response: lsats,
            });
        }
        catch (e) {
            return res_1.failure(res, `could not retrieve lsats`);
        }
    });
}
exports.listLsats = listLsats;
function updateLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        const lsatIdentifier = req.params.id;
        const body = req.body;
        if (logger_1.logging.Express)
            console.log(`=> updateLsat ${lsatIdentifier}`);
        try {
            yield models_1.models.Lsat.update(body, {
                where: { tenant, lsatIdentifier },
            });
            return res_1.success(res, {
                success: true,
                response: 'lsat successfully updated',
            });
        }
        catch (e) {
            return res_1.failure(res, `could not update lsat`);
        }
    });
}
exports.updateLsat = updateLsat;
function deleteLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        const lsatIdentifier = req.params.id;
        if (logger_1.logging.Express)
            console.log(`=> deleteLsat ${lsatIdentifier}`);
        try {
            yield models_1.models.Lsat.destroy({
                where: { tenant, lsatIdentifier },
            });
            return res_1.success(res, {
                success: true,
                response: 'lsat successfully deleted',
            });
        }
        catch (e) {
            return res_1.failure(res, `could not delete lsat`);
        }
    });
}
exports.deleteLsat = deleteLsat;
//# sourceMappingURL=lsats.js.map