"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../utils/config");
const config = config_1.loadConfig();
const IS_GREENLIGHT = config.lightning_provider === "GREENLIGHT";
var libhsmd = {
    Init: function (rootkey, chain) {
        return '';
    },
    Handle: function (capabilities, dbid, peer, payload) {
        return '';
    }
};
if (IS_GREENLIGHT) {
    libhsmd = require('libhsmd');
}
exports.default = libhsmd;
//# sourceMappingURL=libhsmd.js.map