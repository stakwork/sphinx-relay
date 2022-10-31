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
const ava_1 = require("ava");
const http = require("ava-http");
const helpers_1 = require("../utils/helpers");
const save_1 = require("../utils/save");
const config_1 = require("../config");
const nodes_1 = require("../nodes");
const helpers_2 = require("../utils/helpers");
const msg_1 = require("../utils/msg");
ava_1.default.serial('personProfile: Sphinx Person Profile', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield personProfile(t, nodes_1.default[0], nodes_1.default[1]);
}));
function personProfile(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        const internalTribeHost = node1.ip.includes('host.docker.internal')
            ? config_1.config.tribeHost
            : config_1.config.tribeHostInternal;
        //GET CHALLENGE FROM PEOPLE PAGE
        const ask = yield http.get('http://' + config_1.config.tribeHost + '/ask');
        const challenge = ask.challenge;
        t.true(typeof challenge === 'string', 'should return challenge string');
        //VERIFY EXTERNAL FROM RELAY
        const relayVerify = yield http.post(node1.external_ip + '/verify_external', (0, helpers_1.makeArgs)(node1));
        const info = relayVerify.response.info;
        t.true(typeof info === 'object', 'relay verification should return info object');
        const token = relayVerify.response.token;
        t.true(typeof token === 'string', 'token string should exist');
        info.url = node1.external_ip;
        info.route_hint = info.route_hint || '';
        info.alias = info.alias || '';
        t.true(info.url === node1.external_ip, 'node1 ip should be added to info object');
        //TRIBE VERIFY
        const tribesVerify = yield http.post('http://' + config_1.config.tribeHost + `/verify/${challenge}?token=${token}`, { body: info });
        t.truthy(tribesVerify, 'tribe should verify');
        yield (0, helpers_1.sleep)(1000);
        //TRIBE POLL
        const poll = yield http.get('http://' + config_1.config.tribeHost + `/poll/${challenge}`);
        yield (0, helpers_1.sleep)(1000);
        const persontest = yield http.get('http://' + config_1.config.tribeHost + '/person/' + poll.pubkey);
        //POST PROFILE TO RELAY
        const priceToMeet = 13;
        const postProfile = yield http.post(node1.external_ip + '/profile', (0, helpers_1.makeJwtArgs)(poll.jwt, {
            pubkey: node1.pubkey,
            host: internalTribeHost,
            id: persontest.id,
            owner_alias: node1.alias,
            description: 'this description',
            img: poll.photo_url,
            tags: [],
            price_to_meet: priceToMeet,
            extras: { twitter: 'mytwitter' },
        }));
        t.true(postProfile.success, 'post to profile should succeed');
        //NODE2 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node2);
        t.truthy(tribe, 'tribe should have been created by node2');
        //NODE1 JOINS TRIBE CREATED BY NODE2
        if (node2.routeHint)
            tribe.owner_route_hint = node2.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node1, tribe);
        t.true(join, 'node1 should join tribe');
        //NODE1 SENDS A TEXT MESSAGE IN TRIBE
        const text = (0, helpers_2.randomText)();
        let tribeMessage = yield (0, msg_1.sendTribeMessageAndCheckDecryption)(t, node1, node2, text, tribe);
        t.true(!!tribeMessage, 'node1 should send message to tribe');
        // Get All message that belongs to Node 2
        const allMessages = yield (0, msg_1.getAllMessages)(node2);
        const newMessage = (0, msg_1.getSpecificMsg)(allMessages, tribeMessage.uuid);
        t.true((newMessage === null || newMessage === void 0 ? void 0 : newMessage.person) === `${config_1.config.tribeHost}/${postProfile.response.uuid}`, 'Tribe message person value should be equal to tribe host and person profile from tribe server');
    });
}
//# sourceMappingURL=personProfile.test.js.map