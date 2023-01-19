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
exports.listUsers = exports.addProxyUser = exports.removeDefaultJoinTribe = exports.addDefaultJoinTribe = exports.initialAdminPubkey = exports.hasAdmin = void 0;
const res_1 = require("../utils/res");
const proxy_1 = require("../utils/proxy");
const models_1 = require("../models");
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
                return (0, res_1.failure)(res, 'too late');
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
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.owner.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        const id = parseInt(req.params.id);
        if (!id)
            return (0, res_1.failure)(res, 'no id specified');
        try {
            const chat = (yield models_1.models.Chat.findOne({
                where: { id },
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
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.owner.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        const id = parseInt(req.params.id);
        if (!id)
            return (0, res_1.failure)(res, 'no id specified');
        try {
            const chat = (yield models_1.models.Chat.findOne({
                where: { id },
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
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.owner.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        try {
            const initial_sat = parseInt(req.params.sat);
            const rpk = yield (0, proxy_1.getProxyRootPubkey)();
            const created = yield (0, proxy_1.generateNewUser)(rpk, initial_sat || 0);
            (0, res_1.success)(res, created);
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.addProxyUser = addProxyUser;
function listUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.owner.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        try {
            const users = (yield models_1.models.Contact.findAll({
                where: {
                    isOwner: true,
                },
            }));
            (0, res_1.success)(res, { users });
        }
        catch (e) {
            (0, res_1.failure)(res, e);
        }
    });
}
exports.listUsers = listUsers;
//# sourceMappingURL=admin.js.map