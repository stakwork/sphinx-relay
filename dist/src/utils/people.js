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
exports.determineBadgeHost = exports.updateBadgeInTribe = exports.transferBadge = exports.createBadge = exports.claimOnLiquid = exports.deleteTicketByAdmin = exports.deletePerson = exports.createOrEditPerson = void 0;
const config_1 = require("./config");
const tribes_1 = require("./tribes");
const node_fetch_1 = require("node-fetch");
const logger_1 = require("./logger");
const lsat_js_1 = require("lsat-js");
const Lightning = require("../grpc/lightning");
const config = (0, config_1.loadConfig)();
function createOrEditPerson({ host, owner_alias, owner_pubkey, owner_route_hint, owner_contact_key, description, img, tags, price_to_meet, extras, new_ticket_time, uuid, }, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(protocol + '://' + host + '/person?token=' + token, {
                method: 'POST',
                body: JSON.stringify(Object.assign(Object.assign({}, (id && { id })), { // id optional (for editing)
                    owner_alias,
                    owner_pubkey,
                    owner_route_hint,
                    owner_contact_key,
                    description,
                    img, tags: tags || [], price_to_meet: price_to_meet || 0, extras: extras || {}, new_ticket_time: new_ticket_time || 0, uuid })),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to create or edit person ' + r.status;
            }
            const person = yield r.json();
            return person;
        }
        catch (e) {
            logger_1.sphinxLogger.error('unauthorized to create person', logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.createOrEditPerson = createOrEditPerson;
function deletePerson(host, id, owner_pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${host}/person/${id}?token=${token}`, {
                method: 'DELETE',
            });
            if (!r.ok) {
                throw 'failed to delete person ' + r.status;
            }
            // const j = await r.json()
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to delete person`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.deletePerson = deletePerson;
function deleteTicketByAdmin(host, pubkey, created, owner_pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(`${protocol}://${host}/ticket/${pubkey}/${created}?token=${token}`, {
                method: 'DELETE',
            });
            if (!r.ok) {
                throw 'failed to delete ticket by admin' + r.status;
            }
        }
        catch (e) {
            logger_1.sphinxLogger.error(`unauthorized to delete ticket by admin`, logger_1.logging.Tribes);
            throw e;
        }
    });
}
exports.deleteTicketByAdmin = deleteTicketByAdmin;
function claimOnLiquid({ host, asset, to, amount, memo, owner_pubkey, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            const r = yield (0, node_fetch_1.default)(protocol + '://' + host + '/withdraw?token=' + token, {
                method: 'POST',
                body: JSON.stringify({
                    asset,
                    to,
                    amount,
                    memo,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to withdraw to liquid ' + r.status;
            }
            const res = yield r.json();
            return res;
        }
        catch (e) {
            logger_1.sphinxLogger.error('[liquid] unauthorized to move asset', e);
            throw e;
        }
    });
}
exports.claimOnLiquid = claimOnLiquid;
function createBadge({ icon, amount, name, owner_pubkey }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
            const r = yield (0, node_fetch_1.default)(config.boltwall_server + '/create_badge?token=' + token, {
                method: 'POST',
                body: JSON.stringify({
                    icon,
                    name,
                    amount,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                if (r.status === 402) {
                    const header = r.headers.get('www-authenticate');
                    const lsat = lsat_js_1.Lsat.fromHeader(header);
                    const payment = yield Lightning.sendPayment(lsat.invoice);
                    let preimage;
                    if (payment.payment_preimage) {
                        preimage = payment.payment_preimage.toString('hex');
                        lsat.setPreimage(preimage);
                        const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
                        const paidRes = yield (0, node_fetch_1.default)(config.boltwall_server + '/create_badge?token=' + token, {
                            method: 'POST',
                            body: JSON.stringify({
                                icon,
                                name,
                                amount,
                            }),
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: lsat.toToken(),
                            },
                        });
                        if (!paidRes.ok) {
                            throw 'failed to create badge ' + paidRes.status;
                        }
                        const res = yield paidRes.json();
                        return res;
                    }
                }
                else {
                    throw 'failed to create badge ' + r.status;
                }
            }
            const res = yield r.json();
            return res;
        }
        catch (error) {
            logger_1.sphinxLogger.error('[liquid] Badge was not created', error);
            throw error;
        }
    });
}
exports.createBadge = createBadge;
function transferBadge({ to, asset, amount, memo, owner_pubkey }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
            const r = yield (0, node_fetch_1.default)(config.boltwall_server + '/transfer_badge?token=' + token, {
                method: 'POST',
                body: JSON.stringify({
                    to,
                    asset,
                    amount,
                    memo,
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to transfer badge ' + r.status;
            }
            const res = yield r.json();
            return res;
        }
        catch (error) {
            logger_1.sphinxLogger.error('[liquid] Badge was not transfered', error);
            throw error;
        }
    });
}
exports.transferBadge = transferBadge;
function updateBadgeInTribe({ tribeId, action, badge, owner_pubkey, tribe_host, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = yield (0, tribes_1.genSignedTimestamp)(owner_pubkey);
            let protocol = 'https';
            if (config.tribes_insecure)
                protocol = 'http';
            console.log(`${protocol}://${tribe_host}/badges?token=${token}`);
            const r = yield (0, node_fetch_1.default)(`${protocol}://${tribe_host}/badges?token=${token}`, {
                method: 'POST',
                body: JSON.stringify({ badge, tribeId, action }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!r.ok) {
                throw 'failed to update badge in tribe ' + r.status;
            }
            const res = yield r.json();
            return res;
        }
        catch (error) {
            logger_1.sphinxLogger.error('[Badge] Badge was not updated in tribe', error);
            throw error;
        }
    });
}
exports.updateBadgeInTribe = updateBadgeInTribe;
function determineBadgeHost(badgeCode) {
    const badge_host = { 1: 'liquid.sphinx.chat' };
    return badge_host[badgeCode];
}
exports.determineBadgeHost = determineBadgeHost;
//# sourceMappingURL=people.js.map