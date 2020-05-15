"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const rncryptor_1 = require("../utils/rncryptor");
console.log("RNCryptor", rncryptor_1.default);
const constants = require(path.join(__dirname, '../../config/constants.json'));
const msgtypes = constants.message_types;
// `https://${ldat.host}/file/${media_token}`
function modifyPayload(payload) {
    if (payload.type === msgtypes.attachment) {
        console.log("MODIFY, ", payload);
        // download image from mediaToken
        // decrypt key
        // decrypt image
        // new key, re-encrypt, re-upload
        // new payload
        // how to link w og msg? ogMediaToken?
    }
    return payload;
}
exports.modifyPayload = modifyPayload;
//# sourceMappingURL=modify.js.map