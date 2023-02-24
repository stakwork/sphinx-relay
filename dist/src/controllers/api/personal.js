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
exports.reissueBadge = exports.removeBadgeFromTribe = exports.getBadgePerTribe = exports.badgeTemplates = exports.updateBadge = exports.addBadgeToTribe = exports.deleteBadge = exports.getAllBadge = exports.transferBadge = exports.createBadge = exports.claimOnLiquid = exports.refreshJWT = exports.uploadPublicPic = exports.deleteTicketByAdmin = exports.deletePersonProfile = exports.createPeopleProfile = void 0;
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
const badgeBot_1 = require("../../utils/badgeBot");
const tribes_1 = require("../../utils/tribes");
const people_1 = require("../../utils/people");
const config = (0, config_1.loadConfig)();
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
            const { name, icon, amount, memo, reward_type, reward_requirement, chat_id, } = req.body;
            if (typeof name !== 'string' ||
                typeof icon !== 'string' ||
                typeof amount !== 'number')
                return (0, res_1.failure)(res, 'invalid data passed');
            if (reward_requirement && !reward_type) {
                return (0, res_1.failure)(res, 'Please provide reward type');
            }
            if (reward_type && !reward_requirement) {
                return (0, res_1.failure)(res, 'Please provide reward requirement');
            }
            if (chat_id && typeof chat_id !== 'number') {
                return (0, res_1.failure)(res, 'Please provide valid chat id');
            }
            if (reward_type) {
                let validRewardType = false;
                for (const key in constants_1.default.reward_types) {
                    if (constants_1.default.reward_types[key] === reward_type) {
                        validRewardType = true;
                    }
                }
                if (!validRewardType)
                    return (0, res_1.failure)(res, 'invalid reward type');
            }
            if (reward_requirement && typeof reward_requirement !== 'number') {
                return (0, res_1.failure)(res, 'Invalid reward requirement');
            }
            const response = yield people.createBadge({
                icon,
                amount,
                name,
                owner_pubkey: owner.publicKey,
            });
            const badge = (yield models_1.models.Badge.create({
                badgeId: response.id,
                name: response.name,
                amount: response.amount,
                memo,
                asset: response.asset,
                active: true,
                tenant,
                type: constants_1.default.badge_type.liquid,
                host: config.boltwall_server,
                icon: response.icon,
                rewardRequirement: reward_requirement ? reward_requirement : null,
                rewardType: reward_type ? reward_type : null,
            }));
            if (chat_id && reward_requirement && reward_type) {
                const tribe = (yield models_1.models.Chat.findOne({
                    where: {
                        id: chat_id,
                        ownerPubkey: req.owner.publicKey,
                        deleted: false,
                        tenant,
                    },
                }));
                if (tribe) {
                    yield models_1.models.TribeBadge.create({
                        rewardType: badge.rewardType,
                        rewardRequirement: badge.rewardRequirement,
                        badgeId: badge.id,
                        chatId: tribe.id,
                        active: true,
                    });
                    yield (0, badgeBot_1.createBadgeBot)(tribe.id, tenant);
                }
            }
            return (0, res_1.success)(res, {
                badge_id: badge.badgeId,
                icon: badge.icon,
                amount_created: badge.amount,
                asset: badge.asset,
                memo: badge.memo,
                name: badge.name,
            });
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
function getAllBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const limit = (req.query.limit && parseInt(req.query.limit)) || 100;
        const offset = (req.query.offset && parseInt(req.query.offset)) || 0;
        try {
            const badges = (yield models_1.models.Badge.findAll({
                where: { tenant, active: true },
                limit,
                offset,
            }));
            const response = yield (0, node_fetch_1.default)(`${config.boltwall_server}/badge_balance?pubkey=${req.owner.publicKey}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
            const results = yield response.json();
            const balObject = {};
            for (let i = 0; i < results.balances.length; i++) {
                const balance = results.balances[i];
                balObject[balance.asset_id] = balance;
            }
            const finalRes = [];
            for (let j = 0; j < badges.length; j++) {
                const badge = badges[j];
                if (balObject[badge.badgeId]) {
                    finalRes.push({
                        badge_id: badge.badgeId,
                        icon: badge.icon,
                        amount_created: badge.amount,
                        amount_issued: badge.amount - balObject[badge.badgeId].balance,
                        asset: badge.asset,
                        memo: badge.memo,
                        name: badge.name,
                        reward_requirement: badge.rewardRequirement,
                        reward_type: badge.rewardType,
                    });
                }
            }
            return (0, res_1.success)(res, finalRes);
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.getAllBadge = getAllBadge;
function deleteBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const badgeId = req.params.id;
        try {
            const badge = (yield models_1.models.Badge.findOne({
                where: { tenant, badgeId, active: true },
            }));
            if (!badge) {
                return (0, res_1.failure)(res, 'Badge does not exist');
            }
            else {
                yield badge.update({ active: false });
                return (0, res_1.success)(res, `${badge.name} was deleted successfully`);
            }
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.deleteBadge = deleteBadge;
function addBadgeToTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { chat_id, reward_type, reward_requirement, badge_id } = req.body;
        if (!chat_id || !badge_id) {
            return (0, res_1.failure)(res, 'Invalid data passed');
        }
        if (reward_requirement && !reward_type) {
            return (0, res_1.failure)(res, 'Please provide reward type');
        }
        if (reward_type && !reward_requirement) {
            return (0, res_1.failure)(res, 'Please provide reward requirement');
        }
        if (reward_type) {
            let validRewardType = false;
            for (const key in constants_1.default.reward_types) {
                if (constants_1.default.reward_types[key] === reward_type) {
                    validRewardType = true;
                }
            }
            if (!validRewardType)
                return (0, res_1.failure)(res, 'invalid reward type');
        }
        if (reward_requirement && typeof reward_requirement !== 'number') {
            return (0, res_1.failure)(res, 'Invalid reward requirement');
        }
        try {
            const tribe = (yield models_1.models.Chat.findOne({
                where: {
                    id: chat_id,
                    ownerPubkey: req.owner.publicKey,
                    deleted: false,
                    tenant,
                },
            }));
            console.log(tribe);
            if (!tribe) {
                return (0, res_1.failure)(res, 'Invalid tribe');
            }
            const badge = (yield models_1.models.Badge.findOne({
                where: { badgeId: badge_id, tenant, active: true },
            }));
            if (!badge) {
                return (0, res_1.failure)(res, 'Invalid Badge');
            }
            const badgeExist = (yield models_1.models.TribeBadge.findOne({
                where: { chatId: tribe.id, badgeId: badge.id },
            }));
            if (badgeExist && badgeExist.active === true) {
                return (0, res_1.failure)(res, 'Badge already exist in tribe');
            }
            if ((!badge.rewardType && !reward_type) ||
                (!badge.rewardRequirement && !reward_requirement)) {
                return (0, res_1.failure)(res, 'Please provide reward type and reward requirement');
            }
            yield updateTribeServer(badge, tribe, 'add');
            if (badgeExist && badgeExist.active === false) {
                yield badgeExist.update({
                    active: true,
                    rewardType: badge.rewardType ? badge.rewardType : reward_type,
                    rewardRequirement: badge.rewardRequirement
                        ? badge.rewardRequirement
                        : reward_requirement,
                });
            }
            else {
                yield models_1.models.TribeBadge.create({
                    rewardType: badge.rewardType ? badge.rewardType : reward_type,
                    rewardRequirement: badge.rewardRequirement
                        ? badge.rewardRequirement
                        : reward_requirement,
                    badgeId: badge.id,
                    chatId: tribe.id,
                    active: true,
                });
            }
            yield (0, badgeBot_1.createBadgeBot)(tribe.id, tenant);
            return (0, res_1.success)(res, 'Badge was added to tribe successfully');
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.addBadgeToTribe = addBadgeToTribe;
function updateBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { badge_id, icon } = req.body;
        if (!badge_id || !icon) {
            return (0, res_1.failure)(res, 'Missing required data');
        }
        try {
            const badge = yield models_1.models.Badge.findOne({
                where: { badgeId: badge_id, tenant },
            });
            if (!badge) {
                return (0, res_1.failure)(res, "You can't update this badge");
            }
            const token = yield (0, tribes_1.genSignedTimestamp)(req.owner.publicKey);
            const response = yield (0, node_fetch_1.default)(`${config.boltwall_server}/update_badge?token=${token}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: badge_id, icon }),
            });
            if (!response.ok) {
                const newRes = yield response.json();
                return (0, res_1.failure)(res, newRes);
            }
            yield badge.update({ icon });
            return (0, res_1.success)(res, 'Badge Icon updated successfully');
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.updateBadge = updateBadge;
// hardcoded for now
function badgeTemplates(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const ts = [
            {
                rewardType: 1,
                rewardRequirement: 1000,
                icon: 'https://community.sphinx.chat/static/1K.svg',
                name: 'Big Earner',
            },
            {
                rewardType: 2,
                rewardRequirement: 1000,
                icon: 'https://community.sphinx.chat/static/VIP.svg',
                name: 'Big Spender',
            },
        ];
        return (0, res_1.success)(res, ts);
    });
}
exports.badgeTemplates = badgeTemplates;
function getBadgePerTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const limit = (req.query.limit && parseInt(req.query.limit)) || 100;
        const offset = (req.query.offset && parseInt(req.query.offset)) || 0;
        const chat_id = req.params.chat_id;
        try {
            const tribe = (yield models_1.models.Chat.findOne({
                where: {
                    id: chat_id,
                    ownerPubkey: req.owner.publicKey,
                    deleted: false,
                    tenant,
                },
            }));
            if (!tribe) {
                return (0, res_1.failure)(res, 'Invalid tribe');
            }
            const badges = (yield models_1.models.Badge.findAll({
                where: { tenant, active: true },
                limit,
                offset,
            }));
            const tribeBadges = (yield models_1.models.TribeBadge.findAll({
                where: { chatId: tribe.id, active: true },
            }));
            const badgeInTribe = {};
            for (let i = 0; i < tribeBadges.length; i++) {
                const tribeBadge = tribeBadges[i];
                badgeInTribe[tribeBadge.badgeId] = true;
            }
            const response = yield (0, node_fetch_1.default)(`${config.boltwall_server}/badge_balance?pubkey=${req.owner.publicKey}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
            const results = yield response.json();
            const balObject = {};
            for (let i = 0; i < results.balances.length; i++) {
                const balance = results.balances[i];
                balObject[balance.asset_id] = balance;
            }
            const finalRes = [];
            for (let j = 0; j < badges.length; j++) {
                const badge = badges[j];
                if (balObject[badge.badgeId]) {
                    finalRes.push({
                        badge_id: badge.badgeId,
                        icon: badge.icon,
                        amount_created: badge.amount,
                        amount_issued: badge.amount - balObject[badge.badgeId].balance,
                        asset: badge.asset,
                        memo: badge.memo,
                        name: badge.name,
                        reward_requirement: badge.rewardRequirement,
                        reward_type: badge.rewardType,
                        active: badgeInTribe[badge.id] ? true : false,
                    });
                }
            }
            return (0, res_1.success)(res, finalRes);
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.getBadgePerTribe = getBadgePerTribe;
function removeBadgeFromTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { chat_id, badge_id } = req.body;
        if (!chat_id ||
            typeof chat_id !== 'number' ||
            !badge_id ||
            typeof badge_id !== 'number') {
            return (0, res_1.failure)(res, 'Invalid chat id or badge id');
        }
        try {
            const tribe = (yield models_1.models.Chat.findOne({
                where: {
                    id: chat_id,
                    ownerPubkey: req.owner.publicKey,
                    deleted: false,
                    tenant,
                },
            }));
            if (!tribe) {
                return (0, res_1.failure)(res, 'Invalid tribe');
            }
            const badge = (yield models_1.models.Badge.findOne({
                where: { tenant, badgeId: badge_id },
            }));
            if (!badge) {
                return (0, res_1.failure)(res, 'Badge does not exist');
            }
            const badgeTribe = (yield models_1.models.TribeBadge.findOne({
                where: { badgeId: badge.id, chatId: chat_id, active: true },
            }));
            if (!badgeTribe) {
                return (0, res_1.failure)(res, 'Badge does not exist in tribe');
            }
            yield updateTribeServer(badge, tribe, 'remove');
            yield badgeTribe.update({ active: false });
            return (0, res_1.success)(res, 'Badge deactivated successfully');
        }
        catch (error) {
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.removeBadgeFromTribe = removeBadgeFromTribe;
function updateTribeServer(badge, tribe, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const badge_host = (0, people_1.determineBadgeHost)(badge.type);
        yield (0, people_1.updateBadgeInTribe)({
            tribeId: tribe.uuid,
            action,
            badge: `${badge_host}/${badge.badgeId}`,
            owner_pubkey: tribe.ownerPubkey,
            tribe_host: tribe.host,
        });
    });
}
function reissueBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { amount, badge_id } = req.body;
        if (!amount ||
            !badge_id ||
            typeof amount !== 'number' ||
            typeof badge_id !== 'number') {
            return (0, res_1.failure)(res, 'Invalid amount or badge_id');
        }
        try {
            const badge = (yield models_1.models.Badge.findOne({
                where: { tenant, badgeId: badge_id },
            }));
            if (!badge) {
                return (0, res_1.failure)(res, 'invalid badge');
            }
            // Reach out to liquid server
            yield (0, people_1.reissueBadgeOnLiquid)({
                amount,
                badge_id,
                owner_pubkey: req.owner.publicKey,
            });
            //update affected badge row
            yield badge.update({ amount: badge.amount + amount });
            return (0, res_1.success)(res, 'Badge reissued successfully');
        }
        catch (error) {
            console.log(error);
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.reissueBadge = reissueBadge;
//# sourceMappingURL=personal.js.map