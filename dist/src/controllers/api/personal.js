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
exports.refreshJWT = exports.uploadPublicPic = exports.deletePersonProfile = exports.createPeopleProfile = void 0;
const meme = require("../../utils/meme");
const FormData = require("form-data");
const node_fetch_1 = require("node-fetch");
const people = require("../../utils/people");
const models_1 = require("../../models");
const jsonUtils = require("../../utils/json");
const res_1 = require("../../utils/res");
const config_1 = require("../../utils/config");
const jwt_1 = require("../../utils/jwt");
const config = config_1.loadConfig();
// accessed from people.sphinx.chat website
// U3BoaW54IFZlcmlmaWNhdGlvbg== : "Sphinx Verification"
function createPeopleProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, 'no owner');
        const tenant = req.owner.id;
        const priceToMeet = req.body.price_to_meet || 0;
        try {
            const owner = yield models_1.models.Contact.findOne({
                where: { tenant, isOwner: true },
            });
            const { id, host, 
            // pubkey,
            owner_alias, description, img, tags, extras, } = req.body;
            // if (pubkey !== owner.publicKey) {
            //   failure(res, 'mismatched pubkey')
            //   return
            // }
            const person = yield people.createOrEditPerson({
                host: host || config.tribes_host,
                owner_alias: owner_alias || owner.alias,
                description: description || '',
                img: img || owner.photoUrl,
                tags: tags || [],
                price_to_meet: priceToMeet,
                owner_pubkey: owner.publicKey,
                owner_route_hint: owner.routeHint,
                owner_contact_key: owner.contactKey,
                extras: extras || {},
            }, id || null);
            yield owner.update({ priceToMeet: priceToMeet || 0 });
            res_1.success(res, person);
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.createPeopleProfile = createPeopleProfile;
// accessed from people.sphinx.chat website
function deletePersonProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, 'no owner');
        const tenant = req.owner.id;
        try {
            const owner = yield models_1.models.Contact.findOne({
                where: { tenant, isOwner: true },
            });
            const { id, host } = req.body;
            if (!id) {
                return res_1.failure(res, 'no id');
            }
            yield people.deletePerson(host || config.tribes_host, id, owner.publicKey);
            yield owner.update({ priceToMeet: 0 });
            res_1.success(res, jsonUtils.contactToJson(owner));
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.deletePersonProfile = deletePersonProfile;
function uploadPublicPic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, 'no owner');
        const { img_base64, img_type } = req.body;
        let imgType = img_type === 'image/jpeg' ? 'image/jpg' : img_type;
        try {
            const host = config.media_host;
            let imageBase64 = img_base64;
            if (img_base64.indexOf(',') > -1) {
                imageBase64 = img_base64.substr(img_base64.indexOf(',') + 1);
            }
            var encImgBuffer = Buffer.from(imageBase64, 'base64');
            const token = yield meme.lazyToken(req.owner.publicKey, host);
            const form = new FormData();
            form.append('file', encImgBuffer, {
                contentType: imgType || 'image/jpg',
                filename: 'Profile.jpg',
                knownLength: encImgBuffer.length,
            });
            const formHeaders = form.getHeaders();
            let protocol = 'https';
            if (host.includes('localhost'))
                protocol = 'http';
            if (host.includes('meme.sphinx:5555'))
                protocol = 'http';
            const resp = yield node_fetch_1.default(`${protocol}://${host}/public`, {
                method: 'POST',
                headers: Object.assign(Object.assign({}, formHeaders), { Authorization: `Bearer ${token}` }),
                body: form,
            });
            let json = yield resp.json();
            if (!json.muid)
                return res_1.failure(res, 'no muid');
            let theHost = host;
            if (host === 'meme.sphinx:5555')
                theHost = 'localhost:5555';
            res_1.success(res, {
                img: `${protocol}://${theHost}/public/${json.muid}`,
            });
        }
        catch (e) {
            res_1.failure(res, e);
        }
    });
}
exports.uploadPublicPic = uploadPublicPic;
function refreshJWT(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return res_1.failure(res, 'no owner');
        const sc = [jwt_1.scopes.PERSONAL];
        const jot = jwt_1.createJWT(req.owner.publicKey, sc, 10080); // one week
        res_1.success(res, {
            jwt: jot,
        });
    });
}
exports.refreshJWT = refreshJWT;
//# sourceMappingURL=personal.js.map