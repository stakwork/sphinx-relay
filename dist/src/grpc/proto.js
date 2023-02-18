"use strict";
// Generated file. Do not edit. Edit the template proto.ts.template instead.
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadProto = void 0;
const grpc = require("@grpc/grpc-js");
const proto_loader_1 = require("@grpc/proto-loader");
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
const opts = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};
function loadProto(name) {
    return grpc.loadPackageDefinition((0, proto_loader_1.loadSync)(`proto/${name}.proto`, opts));
}
exports.loadProto = loadProto;
//# sourceMappingURL=proto.js.map