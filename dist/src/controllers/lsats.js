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
exports.deleteLsat = exports.updateLsat = exports.listLsats = exports.getActiveLsat = exports.getLsat = exports.saveLsat = exports.payForLsat = void 0;
const lsat_js_1 = require("lsat-js");
const bolt11 = require("@boltz/bolt11");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const res_1 = require("../utils/res");
const Lightning = require("../grpc/lightning");
const constants_1 = require("../constants");
/*
interface LsatResponse {
  paymentRequest: string
  macaroon: string
  issuer: string
  paths: string
  preimage: string
  metadata: string
}
*/
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
        const model = (yield models_1.models.Lsat.findOne({
            where: { identifier },
            attributes: lsatResponseAttributes,
        }));
        if (model)
            return true;
        return false;
    });
}
function extractPubkeyAndPaymentHashFromPaymentRequest(payment_request) {
    var _a;
    const decodedPaymentRequest = bolt11.decode(payment_request);
    const payment_hash = ((_a = decodedPaymentRequest.tags.find((t) => t.tagName === 'payment_hash')) === null || _a === void 0 ? void 0 : _a.data) || '';
    return { payment_hash, public_key: decodedPaymentRequest.payeeNodeKey };
}
function payForLsat(paymentRequest) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!paymentRequest) {
            logger_1.sphinxLogger.error('[pay invoice] "payment_request" is empty', logger_1.logging.Lightning);
            return;
        }
        logger_1.sphinxLogger.info(`[pay invoice] ${paymentRequest}`, logger_1.logging.Lightning);
        const response = yield Lightning.sendPayment(paymentRequest);
        logger_1.sphinxLogger.info(['[pay invoice data]', response], logger_1.logging.Lightning);
        return response.payment_preimage.toString('hex');
    });
}
exports.payForLsat = payForLsat;
function saveLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        logger_1.sphinxLogger.info(`=> saveLsat`, logger_1.logging.Express);
        const { paymentRequest, macaroon, issuer, paths, metadata } = req.body;
        if (!paymentRequest || !macaroon || !issuer) {
            return (0, res_1.failure)(res, 'Missing required LSAT data');
        }
        let lsat;
        try {
            lsat = lsat_js_1.Lsat.fromMacaroon(macaroon, paymentRequest);
        }
        catch (e) {
            logger_1.sphinxLogger.error(['[save lsat] Problem getting Lsat:', e.message], logger_1.logging.Lsat);
            res.status(400);
            return res.json({ success: false, error: 'invalid lsat macaroon' });
        }
        const identifier = lsat.id;
        if (yield lsatAlreadyExists(lsat)) {
            logger_1.sphinxLogger.info(['[pay for lsat] Lsat already exists: ', identifier], logger_1.logging.Lsat);
            return (0, res_1.failure)(res, `Could not save lsat. Already exists`);
        }
        let preimage;
        try {
            //Decode payment request
            const ownerPubkey = req.owner.publicKey;
            const { payment_hash, public_key } = extractPubkeyAndPaymentHashFromPaymentRequest(paymentRequest);
            //check if pubkey from request is the same with owner's pubkey
            if (public_key !== ownerPubkey) {
                preimage = yield payForLsat(paymentRequest);
            }
            else {
                // search for invoice
                const invoice = yield Lightning.getInvoiceHandler(payment_hash, ownerPubkey, true);
                preimage = invoice.preimage;
            }
        }
        catch (e) {
            logger_1.sphinxLogger.error(['[pay for lsat] Problem paying for lsat:', e], logger_1.logging.Lsat);
            res.status(500);
            return (0, res_1.failure)(res, 'Could not pay for lsat');
        }
        if (!preimage) {
            res.status(400);
            return (0, res_1.failure)(res, 'invoice could not be paid');
        }
        try {
            console.log('We are trying to save LSAT, means there was a database error');
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
                status: 1, // lsat are by default active
            });
            return (0, res_1.success)(res, { lsat: lsat.toToken() });
        }
        catch (e) {
            logger_1.sphinxLogger.error(`Tobi logging error: ${JSON.stringify(e)}`);
            return (0, res_1.failure)(res, `failed to save lsat: ${e.message || e}`);
        }
    });
}
exports.saveLsat = saveLsat;
function getLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        const identifier = req.params.identifier;
        logger_1.sphinxLogger.info(`=> getLsat`, logger_1.logging.Express);
        try {
            const lsat = (yield models_1.models.Lsat.findOne({
                where: { tenant, identifier },
                attributes: lsatResponseAttributes,
            }));
            if (!lsat)
                return res.status(404).json({
                    success: false,
                    error: `LSAT with identifier ${identifier} not found`,
                });
            return (0, res_1.success)(res, { lsat });
        }
        catch (e) {
            return (0, res_1.failure)(res, `could not retrieve lsat of id ${identifier}`);
        }
    });
}
exports.getLsat = getLsat;
function getActiveLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        logger_1.sphinxLogger.info(`=> getActiveLsat`, logger_1.logging.Express);
        const issuer = req.query.issuer;
        const where = { tenant, status: 1 };
        if (issuer) {
            where['issuer'] = issuer;
        }
        try {
            const lsat = (yield models_1.models.Lsat.findOne({
                where,
            }));
            if (!lsat) {
                return res
                    .status(404)
                    .json({ success: false, error: 'No Active LSAT found' });
            }
            else {
                return (0, res_1.success)(res, lsat);
            }
        }
        catch (e) {
            return (0, res_1.failure)(res, `could not retrieve active lsat`);
        }
    });
}
exports.getActiveLsat = getActiveLsat;
function listLsats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        logger_1.sphinxLogger.info(`=> listLsats`, logger_1.logging.Express);
        try {
            const lsats = (yield models_1.models.Lsat.findAll({
                where: { tenant },
                attributes: lsatResponseAttributes,
            }));
            return (0, res_1.success)(res, { lsats });
        }
        catch (e) {
            return (0, res_1.failure)(res, `could not retrieve lsats`);
        }
    });
}
exports.listLsats = listLsats;
function updateLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        const identifier = req.params.identifier;
        const body = req.body;
        logger_1.sphinxLogger.info(`=> updateLsat ${identifier}`, logger_1.logging.Express);
        try {
            if (body.status === 'expired') {
                yield models_1.models.Lsat.update(Object.assign(Object.assign({}, body), { status: constants_1.default.lsat_statuses.expired }), {
                    where: { tenant, identifier },
                });
            }
            else {
                yield models_1.models.Lsat.update(body, {
                    where: { tenant, identifier },
                });
            }
            return (0, res_1.success)(res, 'lsat successfully updated');
        }
        catch (e) {
            return (0, res_1.failure)(res, `could not update lsat: ${e.message}`);
        }
    });
}
exports.updateLsat = updateLsat;
function deleteLsat(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const tenant = req.owner.id;
        const identifier = req.params.identifier;
        logger_1.sphinxLogger.info(`=> deleteLsat ${identifier}`, logger_1.logging.Express);
        try {
            yield models_1.models.Lsat.destroy({
                where: { tenant, identifier },
            });
            return (0, res_1.success)(res, 'lsat successfully deleted');
        }
        catch (e) {
            return (0, res_1.failure)(res, `could not delete lsat`);
        }
    });
}
exports.deleteLsat = deleteLsat;
//# sourceMappingURL=lsats.js.map