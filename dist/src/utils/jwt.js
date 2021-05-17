"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = exports.createJWT = void 0;
const nJwt = require("njwt");
const secureRandom = require("secure-random");
__exportStar(require("../scopes"), exports);
// each restart of relay creates new key
// to revoke any JWT out in the wild, just restart relay
var signingKey = secureRandom(256, { type: 'Buffer' });
function createJWT(ownerPubkey, scopes, minutes) {
    const claims = {
        iss: "relay",
        pubkey: ownerPubkey,
        scope: scopes ? scopes.join(', ') : ''
    };
    var jwt = nJwt.create(claims, signingKey);
    const mins = minutes || 5;
    jwt.setExpiration(new Date().getTime() + (mins * 60 * 1000));
    return jwt.compact();
}
exports.createJWT = createJWT;
function verifyJWT(token) {
    try {
        return nJwt.verify(token, signingKey);
    }
    catch (e) {
        return false;
    }
}
exports.verifyJWT = verifyJWT;
//# sourceMappingURL=jwt.js.map