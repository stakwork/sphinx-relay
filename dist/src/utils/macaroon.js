"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const config_1 = require("./config");
const config = config_1.loadConfig();
let inMemoryMacaroon = ''; // hex encoded
function getMacaroon(macName) {
    if (config.unlock) {
        console.log('=> getMacaroon: inMemoryMacaroon', inMemoryMacaroon);
        return inMemoryMacaroon;
    }
    else {
        let macLocation = config.macaroon_location;
        if (macName) {
            macLocation = macLocation.replace(/admin.macaroon/, macName);
        }
        const m = fs.readFileSync(macLocation);
        return m.toString('hex');
    }
}
exports.getMacaroon = getMacaroon;
function setInMemoryMacaroon(mac) {
    console.log('=> setInMemoryMacaroon', mac);
    inMemoryMacaroon = mac;
}
exports.setInMemoryMacaroon = setInMemoryMacaroon;
//# sourceMappingURL=macaroon.js.map