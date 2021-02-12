"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = exports.getQR = void 0;
const publicIp = require("public-ip");
const password_1 = require("../utils/password");
const config_1 = require("./config");
const fs = require('fs');
const config = config_1.loadConfig();
function getQR() {
    return __awaiter(this, void 0, void 0, function* () {
        let theIP;
        const public_url = config.public_url;
        if (public_url)
            theIP = public_url;
        if (!theIP) {
            const ip = process.env.NODE_IP;
            if (!ip) {
                try {
                    theIP = yield publicIp.v4();
                }
                catch (e) { }
            }
            else {
                // const port = config.node_http_port
                // theIP = port ? `${ip}:${port}` : ip
                theIP = ip;
            }
        }
        return Buffer.from(`ip::${theIP}::${password_1.default || ''}`).toString('base64');
    });
}
exports.getQR = getQR;
function connect(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        fs.readFile("public/index.html", function (error, pgResp) {
            return __awaiter(this, void 0, void 0, function* () {
                if (error) {
                    res.writeHead(404);
                    res.write('Contents you are looking are Not Found');
                }
                else {
                    const htmlString = Buffer.from(pgResp).toString();
                    const qr = yield getQR();
                    const rep = htmlString.replace(/CONNECTION_STRING/g, qr);
                    const final = Buffer.from(rep, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(final);
                }
                res.end();
            });
        });
    });
}
exports.connect = connect;
//# sourceMappingURL=connect.js.map