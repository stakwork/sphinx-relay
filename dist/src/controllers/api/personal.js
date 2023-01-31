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
exports.transferBadge = exports.createBadge = exports.claimOnLiquid = exports.refreshJWT = exports.uploadPublicPic = exports.deleteTicketByAdmin = exports.deletePersonProfile = exports.createPeopleProfile = void 0;
const meme = require("../../utils/meme");
const FormData = require("form-data");
const node_fetch_1 = require("node-fetch");
const people = require("../../utils/people");
const models_1 = require("../../models");
const jsonUtils = require("../../utils/json");
const res_1 = require("../../utils/res");
const config_1 = require("../../utils/config");
const jwt_1 = require("../../utils/jwt");
// import { createOrEditBadgeBot } from '../../builtin/badge'
const constants_1 = require("../../constants");
const config = (0, config_1.loadConfig)();
// accessed from people.sphinx.chat website
// U3BoaW54IFZlcmlmaWNhdGlvbg== : "Sphinx Verification"
function createPeopleProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const priceToMeet = req.body.price_to_meet || 0;
        try {
            const owner = (yield models_1.models.Contact.findOne({
                where: { tenant, isOwner: true },
            }));
            const { id, host, owner_alias, description, img, tags, extras, new_ticket_time, } = req.body;
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
                new_ticket_time: new_ticket_time || 0,
                uuid: owner.personUuid || '',
            }, id || null);
            yield owner.update({
                priceToMeet: priceToMeet || 0,
                personUuid: person.uuid,
            });
            (0, res_1.success)(res, person);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.createPeopleProfile = createPeopleProfile;
// accessed from people.sphinx.chat website
function deletePersonProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        try {
            const owner = (yield models_1.models.Contact.findOne({
                where: { tenant, isOwner: true },
            }));
            const { id, host } = req.body;
            if (!id) {
                return (0, res_1.failure)(res, 'no id');
            }
            yield people.deletePerson(host || config.tribes_host, id, owner.publicKey);
            yield owner.update({ priceToMeet: 0 });
            (0, res_1.success)(res, jsonUtils.contactToJson(owner));
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.deletePersonProfile = deletePersonProfile;
function deleteTicketByAdmin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        try {
            const { host, pubkey, created } = req.body;
            const person = yield people.deleteTicketByAdmin(host || config.tribes_host, pubkey, created, req.owner.publicKey);
            (0, res_1.success)(res, person);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.deleteTicketByAdmin = deleteTicketByAdmin;
function uploadPublicPic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const { img_base64, img_type } = req.body;
        const imgType = img_type === 'image/jpeg' ? 'image/jpg' : img_type;
        try {
            const host = config.media_host;
            let imageBase64 = img_base64;
            if (img_base64.indexOf(',') > -1) {
                imageBase64 = img_base64.substr(img_base64.indexOf(',') + 1);
            }
            const encImgBuffer = Buffer.from(imageBase64, 'base64');
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
            const resp = yield (0, node_fetch_1.default)(`${protocol}://${host}/public`, {
                method: 'POST',
                headers: Object.assign(Object.assign({}, formHeaders), { Authorization: `Bearer ${token}` }),
                body: form,
            });
            const json = yield resp.json();
            if (!json.muid)
                return (0, res_1.failure)(res, 'no muid');
            let theHost = host;
            if (host === 'meme.sphinx:5555')
                theHost = 'localhost:5555';
            (0, res_1.success)(res, {
                img: `${protocol}://${theHost}/public/${json.muid}`,
            });
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.uploadPublicPic = uploadPublicPic;
function refreshJWT(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const sc = [jwt_1.scopes.PERSONAL];
        const jot = (0, jwt_1.createJWT)(req.owner.publicKey, sc, 10080); // one week
        (0, res_1.success)(res, {
            jwt: jot,
        });
    });
}
exports.refreshJWT = refreshJWT;
function claimOnLiquid(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        try {
            const owner = (yield models_1.models.Contact.findOne({
                where: { tenant, isOwner: true },
            }));
            const { asset, to, amount, memo } = req.body;
            const r = yield people.claimOnLiquid({
                host: 'liquid.sphinx.chat',
                asset,
                to,
                amount,
                memo,
                owner_pubkey: owner.publicKey,
            });
            (0, res_1.success)(res, r);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.claimOnLiquid = claimOnLiquid;
function createBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        try {
            const owner = (yield models_1.models.Contact.findOne({
                where: { tenant, isOwner: true },
            }));
            const { name, icon, amount, memo } = req.body;
            if (typeof name !== 'string' ||
                typeof icon !== 'string' ||
                typeof amount !== 'number')
                return (0, res_1.failure)(res, 'invalid data passed');
            const response = yield people.createBadge({
                icon,
                amount,
                name,
                owner_pubkey: owner.publicKey,
            });
            yield models_1.models.Badge.create({
                badgeId: response.id,
                name: response.name,
                amount: response.amount,
                memo,
                asset: response.asset,
                deleted: false,
                tenant,
                type: constants_1.default.badge_type.liquid,
                host: config.boltwall_server,
                icon: response.icon,
            });
            return (0, res_1.success)(res, 'Badge Created Successfully');
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.createBadge = createBadge;
function transferBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        try {
            const owner = (yield models_1.models.Contact.findOne({
                where: { tenant, isOwner: true },
            }));
            const { amount, asset, to, memo } = req.body;
            const response = yield people.transferBadge({
                amount,
                memo,
                asset,
                to,
                owner_pubkey: owner.publicKey,
            });
            return (0, res_1.success)(res, response);
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.transferBadge = transferBadge;
//# sourceMappingURL=personal.js.map