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
const nodes_1 = require("../nodes");
const helpers_1 = require("../utils/helpers");
const http = require("ava-http");
const helpers_2 = require("../utils/helpers");
ava_1.default.serial('checkContacts', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield (0, helpers_1.iterate)(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryRoutes(t, node1, node2);
    }));
}));
function queryRoutes(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`=> queryRoutes ${node1.alias} -> ${node2.alias}`);
        let q = `pubkey=${node2.pubkey}`;
        if (node2.routeHint) {
            q += `&route_hint=${node2.routeHint}`;
        }
        var route = yield http.get(node1.external_ip + `/route?${q}`, (0, helpers_2.makeArgs)(node1));
        t.truthy(route.response.success_prob, 'route response success prob should exist');
        t.true(typeof route.response.success_prob === 'number', 'route response success prob should be a number');
        t.true(route.response.success_prob > 0, 'route response should be greater than 0');
        console.log(`${node1.alias} success prob to ${node2.alias}: ${route.response.success_prob}`);
    });
}
//# sourceMappingURL=queryRoutes.test.js.map