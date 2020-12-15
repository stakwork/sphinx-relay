"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const config_1 = require("./config");
const config = config_1.loadConfig();
let inMemoryMacaroon = ''; // hex encoded
function getMacaroon() {
    if (config.unlock) {
        return inMemoryMacaroon;
    }
    else {
        const m = fs.readFileSync(config.macaroon_location);
        return m.toString('hex');
    }
}
exports.getMacaroon = getMacaroon;
function setInMemoryMacaroon(mac) {
    inMemoryMacaroon = mac;
}
exports.setInMemoryMacaroon = setInMemoryMacaroon;
//# sourceMappingURL=macaroon.js.map