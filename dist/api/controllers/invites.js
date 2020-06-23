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
const models_1 = require("../models");
const crypto = require("crypto");
const jsonUtils = require("../utils/json");
const hub_1 = require("../hub");
const finishInvite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { invite_string } = req.body;
    const params = {
        invite: {
            pin: invite_string
        }
    };
    function onSuccess() {
        res.status(200);
        res.json({ success: true });
        res.end();
    }
    function onFailure() {
        res.status(200);
        res.json({ success: false });
        res.end();
    }
    hub_1.finishInviteInHub(params, onSuccess, onFailure);
});
exports.finishInvite = finishInvite;
const payInvite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const params = {
    // 	node_ip: process.env.NODE_IP
    // }
    const invite_string = req.params['invite_string'];
    const dbInvite = yield models_1.models.Invite.findOne({ where: { inviteString: invite_string } });
    const onSuccess = (response) => __awaiter(void 0, void 0, void 0, function* () {
        // const invite = response.object
        // console.log("response", invite)
        // if (dbInvite.status != invite.invite_status) {
        // 	dbInvite.update({ status: invite.invite_status })
        // }
        res.status(200);
        res.json({ success: true, response: { invite: jsonUtils.inviteToJson(dbInvite) } });
        res.end();
    });
    const onFailure = (response) => {
        res.status(200);
        res.json({ success: false });
        res.end();
    };
    // payInviteInHub(invite_string, params, onSuccess, onFailure)
    hub_1.payInviteInvoice(dbInvite.invoice, onSuccess, onFailure);
});
exports.payInvite = payInvite;
const createInvite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nickname, welcome_message } = req.body;
    const owner = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
    const params = {
        invite: {
            nickname: owner.alias,
            pubkey: owner.publicKey,
            contact_nickname: nickname,
            message: welcome_message,
            pin: crypto.randomBytes(20).toString('hex')
        }
    };
    console.log(params);
    const onSuccess = (response) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("response", response);
        const inviteCreated = response.object;
        const contact = yield models_1.models.Contact.create({
            alias: nickname,
            status: 0
        });
        const invite = yield models_1.models.Invite.create({
            welcomeMessage: inviteCreated.message,
            contactId: contact.id,
            status: inviteCreated.invite_status,
            inviteString: inviteCreated.pin,
        });
        let contactJson = jsonUtils.contactToJson(contact);
        if (invite) {
            contactJson.invite = jsonUtils.inviteToJson(invite);
        }
        res.status(200);
        res.json({ success: true, contact: contactJson });
        res.end();
    });
    const onFailure = (response) => {
        res.status(200);
        res.json(response);
        res.end();
    };
    hub_1.createInviteInHub(params, onSuccess, onFailure);
});
exports.createInvite = createInvite;
//# sourceMappingURL=invites.js.map