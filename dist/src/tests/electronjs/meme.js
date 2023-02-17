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
exports.uploadMeme = void 0;
const base_64_1 = require("base-64");
const crypto_1 = require("crypto");
const jscryptor_kevkevin_1 = require("jscryptor-kevkevin");
const node_fetch_1 = require("node-fetch");
const FormData = require("form-data");
function uploadMeme(fileBase64, typ, host, token, filename, isPublic) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let imgBuf = dataURLtoBuf(fileBase64);
            let finalImgBuffer;
            let newKey = '';
            if (isPublic) {
                finalImgBuffer = Buffer.from(imgBuf);
            }
            else {
                newKey = (0, crypto_1.randomBytes)(20).toString('hex');
                const encImgBase64 = (0, jscryptor_kevkevin_1.Encrypt)(imgBuf, newKey);
                finalImgBuffer = Buffer.from(encImgBase64, 'base64');
            }
            const form = new FormData();
            form.append('file', finalImgBuffer, {
                contentType: typ || 'image/jpg',
                filename: filename || 'Image.jpg',
                knownLength: finalImgBuffer.length,
            });
            const formHeaders = form.getHeaders();
            let protocol = 'https';
            if (host.includes('localhost'))
                protocol = 'http';
            const resp = yield (0, node_fetch_1.default)(`${protocol}://${host}/${isPublic ? 'public' : 'file'}`, {
                method: 'POST',
                headers: Object.assign(Object.assign({}, formHeaders), { Authorization: `Bearer ${token}` }),
                body: form,
            });
            let json = yield resp.json();
            if (!json.muid)
                throw new Error('no muid');
            return {
                muid: json.muid,
                media_key: newKey,
            };
        }
        catch (e) {
            throw e;
        }
    });
}
exports.uploadMeme = uploadMeme;
function dataURLtoBuf(dataurl) {
    let arr = dataurl.split(','), 
    //mime = arr[0].match(/:(.*?);/)[1],
    bstr = (0, base_64_1.decode)(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return u8arr;
}
//# sourceMappingURL=meme.js.map