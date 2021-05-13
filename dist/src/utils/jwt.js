"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = exports.createJWT = void 0;
const njwt_1 = require("njwt");
const secure_random_1 = require("secure-random");
// each restart of relay creates new key
// to revoke any JWT out in the wild, just restart relay
var signingKey = secure_random_1.default(256, { type: 'Buffer' });
function createJWT(ownerPubkey, minutes) {
    const claims = {
        iss: "relay",
        pubkey: ownerPubkey,
    };
    var jwt = njwt_1.default.create(claims, signingKey);
    const mins = minutes || 5;
    jwt.setExpiration(new Date().getTime() + (mins * 60 * 1000));
    return jwt.compact();
}
exports.createJWT = createJWT;
function verifyJWT(token) {
    try {
        return njwt_1.default.verify(token, signingKey);
    }
    catch (e) {
        return false;
    }
}
exports.verifyJWT = verifyJWT;
//# sourceMappingURL=jwt.js.map