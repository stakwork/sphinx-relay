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
exports.adminBalance = exports.listTribes = exports.listUsers = exports.addProxyUser = exports.removeDefaultJoinTribe = exports.addDefaultJoinTribe = exports.initialAdminPubkey = exports.hasAdmin = exports.swarmAdminRegister = void 0;
const crypto = require("crypto");
const res_1 = require("../utils/res");
const json = require("../utils/json");
const proxy_1 = require("../utils/proxy");
const models_1 = require("../models");
const constants_1 = require("../constants");
const Lightning = require("../grpc/lightning");
const swarmAdminRegister = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pubkey = req.body['pubkey'];
    if (!pubkey) {
        return (0, res_1.failure)(res, 'no pubkey');
    }
    const owner = (yield models_1.models.Contact.findOne({
        where: { isOwner: true, publicKey: pubkey },
    }));
    if (!owner) {
        return (0, res_1.failure)(res, 'no owner');
    }
    const token = req.body['token'];
    if (!token) {
        return (0, res_1.failure)(res, 'no token in body');
    }
    const hash = crypto.createHash('sha256').update(token).digest('base64');
    if (owner.adminToken) {
        if (owner.adminToken !== hash) {
            return (0, res_1.failure)(res, 'invalid admin token');
        }
    }
    else {
        yield owner.update({ adminToken: hash, isAdmin: true });
    }
    (0, res_1.success)(res, {
        id: (owner && owner.id) || 0,
    });
});
exports.swarmAdminRegister = swarmAdminRegister;
function hasAdmin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        try {
            const admin = (yield models_1.models.Contact.findOne({
                where: {
                    isOwner: true,
                    isAdmin: true,
                },
            }));
            (0, res_1.success)(res, admin ? true : false);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.hasAdmin = hasAdmin;
// this is needed for the initial admin token generation
function initialAdminPubkey(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        try {
            const contacts = (yield models_1.models.Contact.findAll());
            if (contacts.length !== 1)
                return (0, res_1.failure)(res, 'too late' + contacts.length);
            const admin = contacts[0];
            if (admin.authToken || admin.contactKey)
                return (0, res_1.failure)(res, 'too late');
            const pubkey = admin.publicKey;
            (0, res_1.success)(res, { pubkey });
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.initialAdminPubkey = initialAdminPubkey;
function addDefaultJoinTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.admin)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.admin.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        const id = parseInt(req.params.id);
        if (!id)
            return (0, res_1.failure)(res, 'no id specified');
        try {
            const chat = (yield models_1.models.Chat.findOne({
                where: { id, tenant: req.admin.id },
            }));
            if (!chat)
                return (0, res_1.failure)(res, 'chat not found');
            yield chat.update({ defaultJoin: true });
            (0, res_1.success)(res, true);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.addDefaultJoinTribe = addDefaultJoinTribe;
function removeDefaultJoinTribe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.admin)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.admin.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        const id = parseInt(req.params.id);
        if (!id)
            return (0, res_1.failure)(res, 'no id specified');
        try {
            const chat = (yield models_1.models.Chat.findOne({
                where: { id, tenant: req.admin.id },
            }));
            if (!chat)
                return (0, res_1.failure)(res, 'chat not found');
            yield chat.update({ defaultJoin: false });
            (0, res_1.success)(res, true);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.removeDefaultJoinTribe = removeDefaultJoinTribe;
function addProxyUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.admin)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.admin.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        try {
            const initial_sat = parseInt(req.query.sats);
            console.log('-> addProxyUser initial sats', initial_sat);
            const rpk = yield (0, proxy_1.getProxyRootPubkey)();
            const created = yield (0, proxy_1.generateNewUser)(rpk, initial_sat || 0);
            if (created)
                (0, res_1.success)(res, json.contactToJson(created));
            else
                (0, res_1.failure)(res, 'failed to create new proxy user');
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.addProxyUser = addProxyUser;
function listUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.admin)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.admin.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        try {
            const users = (yield models_1.models.Contact.findAll({
                where: {
                    isOwner: true,
                },
            }));
            (0, res_1.success)(res, { users: users.map((u) => json.contactToJson(u)) });
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.listUsers = listUsers;
function listTribes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.admin)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.admin.id;
        const chats = (yield models_1.models.Chat.findAll({
            where: { deleted: false, tenant, type: constants_1.default.chat_types.tribe },
            raw: true,
        }));
        const c = chats.map((chat) => json.chatToJson(chat));
        (0, res_1.success)(res, c);
    });
}
exports.listTribes = listTribes;
function adminBalance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.admin)
            return (0, res_1.failure)(res, 'no owner');
        res.status(200);
        try {
            const blcs = yield Lightning.complexBalances(req.admin.publicKey);
            res.json({
                success: true,
                response: blcs,
            });
        }
        catch (e) {
            res.json({ success: false });
        }
        res.end();
    });
}
exports.adminBalance = adminBalance;
//# sourceMappingURL=admin.js.map