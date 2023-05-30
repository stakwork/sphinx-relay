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
exports.createTribe = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const get_1 = require("../get");
function createTribe(t, node, escrowAmount, escrowMillis, ppm, privacy) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = `Test Tribe: ${node.alias}`;
        const description = 'A testing tribe';
        //new tribe object
        const newTribe = {
            name,
            description,
            tags: [],
            is_tribe: true,
            price_per_message: ppm || 0,
            price_to_join: 0,
            escrow_amount: escrowAmount || 0,
            escrow_millis: escrowMillis || 0,
            img: '',
            unlisted: true,
            private: privacy || false,
            app_url: '',
            feed_url: '',
            feed_type: 0,
            pin: 'A pinned message',
        };
        //node1 creates new tribe
        let c = yield http.post(node.external_ip + '/group', (0, helpers_1.makeArgs)(node, newTribe));
        //check that new tribe was created successfully
        t.true(c.success, 'create tribe should be successful');
        //save id of test tribe
        const newTribeId = c.response.id;
        //get new tribe by Id
        const r = yield (0, get_1.getCheckTribe)(t, node, newTribeId);
        //check that the chat was found
        t.true(typeof r === 'object', 'the newly created chat should be found');
        //check the tribe owner  id
        const tribe = yield (0, get_1.getTribeByUuid)(t, r);
        t.true(tribe.owner_pubkey === c.response.owner_pubkey, 'Owner Id should be the same on every level');
        return r;
    });
}
exports.createTribe = createTribe;
//# sourceMappingURL=createTribe.js.map