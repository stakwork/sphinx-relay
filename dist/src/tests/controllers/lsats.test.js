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
const lsat_js_1 = require("lsat-js");
const helpers_1 = require("../utils/helpers");
const nodes = require("../nodes");
const save_1 = require("../utils/save");
const get_1 = require("../utils/get");
const alice = nodes[0];
const bob = nodes[1];
const getIdentifierFromToken = (token) => lsat_js_1.Lsat.fromToken(token).id;
const addLsatToContext = (t, token) => {
    const identifier = getIdentifierFromToken(token);
    t.assert(identifier.length);
    t.context.identifiers.push(identifier);
    return identifier;
};
ava_1.default.before((t) => {
    t.context.identifiers = [];
});
ava_1.default.after.always('cleanup lsats', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifiers } = t.context;
    for (const i of identifiers) {
        try {
            yield helpers_1.makeRelayRequest('del', `/lsats/${i}`, alice);
        }
        catch (e) {
            console.error(`Could not cleanup lsat ${i}, ${e.message}`);
        }
    }
}));
ava_1.default.serial('saveLsat', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield save_1.saveLsat(t, alice, bob);
    t.assert(token.length, 'expected an lsat token in response');
    addLsatToContext(t, token);
}));
ava_1.default.serial('getLsat', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield save_1.saveLsat(t, alice, bob);
    const identifier = addLsatToContext(t, token);
    const { lsat } = yield helpers_1.makeRelayRequest('get', `/lsats/${identifier}`, alice);
    t.assert(lsat, 'expected to get the lsat back');
    t.truthy(lsat.preimage, 'LSAT should have preimage as proof of payment');
}));
ava_1.default.serial('listLsats', (t) => __awaiter(void 0, void 0, void 0, function* () {
    let { lsats } = yield helpers_1.makeRelayRequest('get', '/lsats', alice);
    const initialCount = lsats.length;
    t.assert(initialCount || initialCount === 0, 'expected to get list of lsats');
    const lsatCount = 3;
    let counter = 0;
    while (counter < lsatCount) {
        counter++;
        const token = yield save_1.saveLsat(t, alice, bob);
        addLsatToContext(t, token);
    }
    lsats = (yield helpers_1.makeRelayRequest('get', '/lsats', alice)).lsats;
    t.assert(lsats.length === initialCount + lsatCount);
}));
ava_1.default.serial('updateLsat', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield save_1.saveLsat(t, alice, bob);
    const identifier = addLsatToContext(t, token);
    let lsat = yield get_1.getLsat(t, alice, identifier);
    t.assert(lsat.metadata === null, 'expected lsat metadata to be null');
    const metadata = {
        foo: 'bar',
    };
    yield helpers_1.makeRelayRequest('put', `/lsats/${identifier}`, alice, {
        metadata: JSON.stringify(metadata),
    });
    lsat = yield get_1.getLsat(t, alice, identifier);
    const updated = JSON.parse(lsat.metadata);
    t.deepEqual(updated, metadata);
}));
ava_1.default.serial('deleteLsats', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield save_1.saveLsat(t, alice, bob);
    const identifier = getIdentifierFromToken(token);
    yield helpers_1.makeRelayRequest('del', `/lsats/${identifier}`, alice);
    try {
        yield helpers_1.makeRelayRequest('get', `/lsats/${identifier}`, alice);
        t.fail('expected GET request to fail');
    }
    catch (e) {
        t.is(e.response.statusCode, 404);
    }
}));
//# sourceMappingURL=lsats.test.js.map