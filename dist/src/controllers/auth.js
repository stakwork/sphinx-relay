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
exports.requestTransportKey = exports.requestExternalTokens = exports.verifyAuthRequest = void 0;
const fs = require("fs");
const jwt_1 = require("../utils/jwt");
const res_1 = require("../utils/res");
const config_1 = require("../utils/config");
const tribes = require("../utils/tribes");
const cert_1 = require("../utils/cert");
const config = (0, config_1.loadConfig)();
/**
 *Verify an auth request.
 *@param {Req} req - The request object
 *@param {Response} res - The response object
 *@returns {Promise<void>}
 **/
function verifyAuthRequest(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        try {
            const sc = [jwt_1.scopes.PERSONAL, jwt_1.scopes.BOTS];
            const jot = (0, jwt_1.createJWT)(req.owner.publicKey, sc, 10080); // one week
            const bod = {
                pubkey: req.owner.publicKey,
                alias: req.owner.alias,
                photo_url: req.owner.photoUrl,
                route_hint: req.owner.routeHint,
                contact_key: req.owner.contactKey,
                price_to_meet: req.owner.priceToMeet,
                jwt: jot,
            };
            const token = yield tribes.genSignedTimestamp(req.owner.publicKey);
            (0, res_1.success)(res, {
                info: bod,
                token,
            });
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.verifyAuthRequest = verifyAuthRequest;
/**
 *Returns information about the authenticated user
 *@param {Object} req - The request object
 *@param {Object} res - The response object
 *@returns {Object} - Returns an object with information about the authenticated user
 **/
function requestExternalTokens(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        try {
            const result = {
                pubkey: req.owner.publicKey,
                alias: req.owner.alias,
                photo_url: req.owner.photoUrl,
                route_hint: req.owner.routeHint,
                contact_key: req.owner.contactKey,
                price_to_meet: req.owner.priceToMeet,
                jwt: '',
            };
            (0, res_1.success)(res, result);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.requestExternalTokens = requestExternalTokens;
/**
 * This function is an Express.js route handler that is used to handle HTTP requests to the /requestTransportKey endpoint. The function retrieves the transport key (public key) from the specified location in the config object, or generates a new transport key if one is not found. The transport key is then returned in the response.

@param {Req} req - The Express.js request object containing information about the incoming request.
@param {Response} res - The Express.js response object used to send a response back to the client.

@returns {void} - This function does not return a value. It sends the transport key in the response.
*/
function requestTransportKey(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let transportPublicKey = null;
        try {
            transportPublicKey = fs.readFileSync(config.transportPublicKeyLocation, 'utf8');
        }
        catch (e) {
            //We want to do nothing here
        }
        if (transportPublicKey != null) {
            (0, res_1.success)(res, { transport_key: transportPublicKey });
            return;
        }
        const transportTokenKeys = yield (0, cert_1.generateTransportTokenKeys)();
        (0, res_1.success)(res, { transport_key: transportTokenKeys });
    });
}
exports.requestTransportKey = requestTransportKey;
//# sourceMappingURL=auth.js.map