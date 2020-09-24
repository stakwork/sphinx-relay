"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./tv42_zbase32_gopherjs");
function encode(b) {
    return global['zbase32'].Encode(b);
}
exports.encode = encode;
function decode(txt) {
    return global['zbase32'].Decode(txt);
}
exports.decode = decode;
//# sourceMappingURL=index.js.map