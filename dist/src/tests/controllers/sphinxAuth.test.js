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
const config_1 = require("../config");
const nodes_1 = require("../nodes");
const helpers_1 = require("../utils/helpers");
ava_1.default.serial('sphinxAuth: Testing Sphinx Auth', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, helpers_1.asyncForEach)(nodes_1.default, (node) => __awaiter(void 0, void 0, void 0, function* () {
        yield sphinxAuth(t, node);
    }));
}));
function sphinxAuth(t, node) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`${node.alias} is starting sphinx auth`);
        //GET CHALLENGE FROM Auth Server
        const ask = yield http.get('http://' + config_1.config.authHost + '/ask');
        const challenge = ask.challenge;
        t.true(typeof challenge === 'string', 'should return challenge string');
        //Node signs the Challenge Passed
        const signer = yield http.get(`${node.external_ip}/signer/${challenge}`, (0, helpers_1.makeArgs)(node));
        const sig = signer.response.sig;
        t.true(typeof sig === 'string', 'Signer route should return a sig');
        //Verify Signature from Auth server
        const verify = yield http.post(`http://${config_1.config.authHost}/verify`, {
            form: { id: ask.id, sig: sig, pubkey: node.pubkey },
        });
        const token = verify.token;
        t.true(typeof token === 'string', 'Verify route on auth server should return a token');
        console.log(`${node.alias} finished sphinx auth`);
    });
}
//# sourceMappingURL=sphinxAuth.test.js.map