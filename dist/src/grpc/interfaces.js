"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfoResponse = void 0;
function getInfoResponse(res) {
    if ('identity_pubkey' in res) { // LND
        return res;
    }
    if ('node_id' in res) { // greenlight
        return {
            identity_pubkey: Buffer.from(res.node_id).toString('hex'),
            version: res.version,
            alias: res.alias,
            color: res.color,
            num_peers: res.num_peers,
        };
    }
    return {};
}
exports.getInfoResponse = getInfoResponse;
//# sourceMappingURL=interfaces.js.map