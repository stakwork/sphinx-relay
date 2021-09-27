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
    'identifier',
];
function lsatAlreadyExists(lsat) {
    return __awaiter(this, void 0, void 0, function* () {
        const identifier = lsat.id;
        const model = yield models_1.models.Lsat.findOne({
            where: { identifier },
            attributes: lsatResponseAttributes,
        });
        if (model)
            return true;
        return false;
    });
}
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
        return response.payment_preimage.toString('hex');
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
            lsat = lsat_js_1.Lsat.fromMacaroon(macaroon, paymentRequest);
        }
        catch (e) {
            if (logger_1.logging.Lsat) {
                console.error('[save lsat] Problem getting Lsat:', e.message);
            }
            res.status(400);
            return res.json({ success: false, error: 'invalid lsat macaroon' });
        }
        const identifier = lsat.id;
        if (yield lsatAlreadyExists(lsat)) {
            if (logger_1.logging.Lsat)
                console.error('[pay for lsat] Lsat already exists: ', identifier);
            return res_1.failure(res, `Could not save lsat. Already exists`);
        }
        let preimage;
        try {
            preimage = yield payForLsat(paymentRequest);
        }
        catch (e) {
            if (logger_1.logging.Lsat)
                console.error('[pay for lsat] Problem paying for lsat:', e);
            res.status(500);
            return res_1.failure(res, 'Could not pay for lsat');
        }
        if (!preimage) {
            res.status(400);
            return res_1.failure(res, 'invoice could not be paid');
        }
        try {
            lsat.setPreimage(preimage);
            yield models_1.models.Lsat.create({
                macaroon,
                identifier,
                paymentRequest,
                preimage,
                issuer,
                paths,
                metadata,
                tenant,
            });
            return res_1.success(res, { lsat: lsat.toToken() });
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
        const identifier = req.params.identifier;
        if (logger_1.logging.Express)
            console.log(`=> getLsat`);
        try {
            const lsat = yield models_1.models.Lsat.findOne({
                where: { tenant, identifier },
                attributes: lsatResponseAttributes,
            });
            if (!lsat)
                return res.status(404).json({
                    success: false,
                    error: `LSAT with identifier ${identifier} not found`,
                });
            return res_1.success(res, { lsat });
        }
        catch (e) {
            return res_1.failure(res, `could not retrieve lsat of id ${identifier}`);
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
            return res_1.success(res, { lsats });
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
        const identifier = req.params.identifier;
        const body = req.body;
        if (logger_1.logging.Express)
            console.log(`=> updateLsat ${identifier}`);
        try {
            yield models_1.models.Lsat.update(body, {
                where: { tenant, identifier },
            });
            return res_1.success(res, 'lsat successfully updated');
        }
        catch (e) {
            return res_1.failure(res, `could not update lsat: ${e.message}`);
        }
    });
}
exports.updateLsat = updateLsat;
function deleteLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        const identifier = req.params.identifier;
        if (logger_1.logging.Express)
            console.log(`=> deleteLsat ${identifier}`);
        try {
            yield models_1.models.Lsat.destroy({
                where: { tenant, identifier },
            });
            return res_1.success(res, 'lsat successfully deleted');
        }
        catch (e) {
            return res_1.failure(res, `could not delete lsat`);
        }
    });
}
exports.deleteLsat = deleteLsat;
//# sourceMappingURL=lsats.js.map