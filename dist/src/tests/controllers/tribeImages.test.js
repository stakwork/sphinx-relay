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
exports.tribeImages = void 0;
const ava_1 = require("ava");
const helpers_1 = require("../utils/helpers");
const nodes_1 = require("../nodes");
const save_1 = require("../utils/save");
const del_1 = require("../utils/del");
const msg_1 = require("../utils/msg");
const base64images_1 = require("../utils/base64images");
/*
npx ava src/tests/controllers/tribeImages.test.ts --verbose --serial --timeout=2m
*/
(0, ava_1.default)('test tribeImages: create tribe, join tribe, send images, leave tribe, delete tribe', (t) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, helpers_1.iterate)(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield tribeImages(t, node1, node2);
    }));
}));
function tribeImages(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND IMAGES WITHIN A TRIBE ===>
        console.log(`Sending Tribe images from ${node1.alias} and ${node2.alias}`);
        //NODE1 CREATES A TRIBE
        let tribe = yield (0, save_1.createTribe)(t, node1);
        t.truthy(tribe, 'tribe should have been created by node1');
        //NODE2 JOINS TRIBE CREATED BY NODE1
        if (node1.routeHint)
            tribe.owner_route_hint = node1.routeHint;
        let join = yield (0, save_1.joinTribe)(t, node2, tribe);
        t.true(join, 'node2 should join tribe');
        //NODE1 SEND IMAGE TO NODE2
        const image = base64images_1.greenSquare;
        const imageSent = yield (0, msg_1.sendImage)(t, node1, node2, image, tribe);
        t.true(!!imageSent, 'message should have been sent');
        //NODE2 SENDS AN IMAGE TO NODE1
        const image2 = base64images_1.pinkSquare;
        const imageSent2 = yield (0, msg_1.sendImage)(t, node2, node1, image2, tribe);
        t.true(!!imageSent2, 'message should have been sent');
        //NODE2 LEAVES TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left2, 'node2 should leave tribe');
        //NODE1 DELETES TRIBE
        let delTribe2 = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe2, 'node1 should delete tribe');
    });
}
exports.tribeImages = tribeImages;
//# sourceMappingURL=tribeImages.test.js.map