"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setInMemoryMacaroon = exports.getMacaroon = void 0;
const fs = require("fs");
const config_1 = require("./config");
const config = config_1.loadConfig();
let inMemoryMacaroon = ''; // hex encoded
function getMacaroon(macName) {
    if (config.unlock) {
        return inMemoryMacaroon;
    }
    else {
        let macLocation = config.macaroon_location;
        if (macName) {
            const location = config[`${macName.split('.')[0]}_macaroon_location`];
            macLocation = location || macLocation.replace('admin.macaroon', macName);
        }
        const m = fs.readFileSync(macLocation);
        return m.toString('hex');
    }
}
exports.getMacaroon = getMacaroon;
function setInMemoryMacaroon(mac) {
    inMemoryMacaroon = mac;
}
exports.setInMemoryMacaroon = setInMemoryMacaroon;
//# sourceMappingURL=macaroon.js.map