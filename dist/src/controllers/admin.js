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
exports.listUsers = exports.addProxyUser = void 0;
const res_1 = require("../utils/res");
const proxy_1 = require("../utils/proxy");
const models_1 = require("../models");
function addProxyUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        if (!req.owner.isAdmin)
            return (0, res_1.failure)(res, 'not admin');
        if (!(0, proxy_1.isProxy)())
            return (0, res_1.failure)(res, 'not proxy');
        try {
            const rpk = yield (0, proxy_1.getProxyRootPubkey)();
            const created = yield (0, proxy_1.generateNewUser)(rpk);
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