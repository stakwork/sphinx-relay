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
exports.uploadFile = exports.avatarUpload = void 0;
const models_1 = require("../models");
const path = require("path");
const config_1 = require("../utils/config");
const multer = require("multer");
const config = config_1.loadConfig();
// setup disk storage
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = __dirname.includes('/dist/')
            ? path.join(__dirname, '..')
            : __dirname;
        cb(null, dir + '/../../public/uploads');
    },
    filename: (req, file, cb) => {
        const mime = file.mimetype;
        const extA = mime.split('/');
        const ext = extA[extA.length - 1];
        if (req.body.chat_id) {
            cb(null, `chat_${req.body.chat_id}_picture.${ext}`);
        }
        else {
            cb(null, `${req.body.contact_id}_profile_picture.${ext}`);
        }
    },
});
exports.avatarUpload = multer({ storage: avatarStorage });
function hasProtocol(ip) {
    if (ip.startsWith('https://'))
        return true;
    if (ip.startsWith('http://'))
        return true;
    return false;
}
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { contact_id, chat_id } = req.body;
    const { file } = req;
    const ip = String(process.env.NODE_IP);
    let theIP = ip;
    if (!hasProtocol(ip)) {
        theIP = config.node_http_protocol + '://' + ip;
    }
    const photo_url = theIP + '/static/uploads/' + file.filename;
    if (contact_id) {
        const contact = yield models_1.models.Contact.findOne({ where: { id: contact_id } });
        if (contact)
            contact.update({ photoUrl: photo_url });
    }
    if (chat_id) {
        const chat = yield models_1.models.Chat.findOne({ where: { id: chat_id } });
        if (chat)
            chat.update({ photoUrl: photo_url });
    }
    res.status(200);
    res.json({
        success: true,
        contact_id: parseInt(contact_id || 0),
        chat_id: parseInt(chat_id || 0),
        photo_url,
    });
    res.end();
});
exports.uploadFile = uploadFile;
//# sourceMappingURL=uploads.js.map