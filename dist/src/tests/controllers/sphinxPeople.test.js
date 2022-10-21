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
const config_1 = require("../config");
const nodes_1 = require("../nodes");
ava_1.default.serial('sphinxPeople: Sphinx People testing', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield sphinxPeople(t, nodes_1.default[0]);
}));
function sphinxPeople(t, node1) {
    return __awaiter(this, void 0, void 0, function* () {
        //TESTING FOR SPHINX PEOPLE PAGE ===>
        // if running "no-alice" version with local relay
        const internalTribeHost = node1.ip.includes('host.docker.internal')
            ? config_1.config.tribeHost
            : config_1.config.tribeHostInternal;
        console.log(node1.alias);
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
        yield (0, helpers_1.sleep)(1000);
        //GET PERSON FROM TRIBE SERVER
        const person = yield http.get('http://' + config_1.config.tribeHost + '/person/' + poll.pubkey);
        t.truthy(person.extras.twitter === 'mytwitter', 'extra should exist');
        //GET PERSON FROM RELAY
        const res = yield http.get(node1.external_ip + '/contacts', (0, helpers_1.makeArgs)(node1));
        //create node contact object from node perspective
        let self = res.response.contacts.find((contact) => contact.public_key === node1.pubkey);
        //CHECK THAT PRICE TO MEET FROM TRIBES IS SAME AS PRICE TO MEET FROM RELAY
        t.true(person.price_to_meet === priceToMeet, 'tribe server profile should have price to meet');
        t.true(person.price_to_meet === self.price_to_meet, 'relay server should have price to meet');
        //UPDATE AND RESET PRICE_TO_MEET WITH PROFILE POST ID
        const newPriceToMeet = 0;
        const postProfile2 = yield http.post(node1.external_ip + `/profile`, (0, helpers_1.makeJwtArgs)(poll.jwt, {
            pubkey: node1.pubkey,
            id: person.id,
            host: internalTribeHost,
            owner_alias: node1.alias,
            description: 'this description',
            img: poll.photo_url,
            tags: [],
            price_to_meet: newPriceToMeet,
        }));
        t.true(postProfile2.success, 'post to profile with id should succeed');
        yield (0, helpers_1.sleep)(1000);
        //GET PERSON FROM TRIBE SERVER
        const person2 = yield http.get('http://' + config_1.config.tribeHost + '/person/' + poll.pubkey);
        //GET PERSON FROM RELAY
        const res2 = yield http.get(node1.external_ip + '/contacts', (0, helpers_1.makeArgs)(node1));
        //create node contact object from node perspective
        let self2 = res2.response.contacts.find((contact) => contact.public_key === node1.pubkey);
        //CHECK THAT PRICE TO MEET FROM TRIBES IS SAME AS PRICE TO MEET FROM RELAY
        t.true(person2.price_to_meet === newPriceToMeet, 'tribes server should reset price to meet to newPriceToMeet');
        t.true(person2.price_to_meet === self2.price_to_meet, 'Relay server should reset price to meet to newPriceToMeet');
        //TRY TO UPDATE AND RESET PRICE_TO_MEET WITH RANDOM ID
        // try {
        //   await http.post(
        //     node1.external_ip + `/profile`,
        //     makeJwtArgs(poll.jwt, {
        //       id: 321,
        //       host: internalTribeHost,
        //       owner_alias: node1.alias,
        //       description: 'this description',
        //       img: poll.photo_url,
        //       tags: [],
        //       price_to_meet: newPriceToMeet,
        //     })
        //   )
        // } catch (e) {}
        //DELETE PERSON PROFILE AT END OF TEST
        const del = yield http.del(node1.external_ip + '/profile', (0, helpers_1.makeArgs)(node1, { id: person2.id, host: internalTribeHost }));
        t.true(del.success, 'profile should be deleted');
    });
}
//# sourceMappingURL=sphinxPeople.test.js.map