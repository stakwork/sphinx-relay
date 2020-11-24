"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env];
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