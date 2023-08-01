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
exports.paidTribeImages = void 0;
const ava_1 = require("ava");
const nodes_1 = require("../nodes");
const base64images_1 = require("../utils/base64images");
const helpers_1 = require("../utils/helpers");
const msg_1 = require("../utils/msg");
const del_1 = require("../utils/del");
const save_1 = require("../utils/save");
ava_1.default.serial('checkContacts', (t) => __awaiter(void 0, void 0, void 0, function* () {
    t.true(Array.isArray(nodes_1.default));
    yield (0, helpers_1.iterate)(nodes_1.default, (node1, node2) => __awaiter(void 0, void 0, void 0, function* () {
        yield paidTribeImages(t, node1, node2);
    }));
}));
function paidTribeImages(t, node1, node2) {
    return __awaiter(this, void 0, void 0, function* () {
        //TWO NODES SEND PAID IMAGES TO EACH OTHER ===>
        console.log(`${node1.alias} and ${node2.alias}`);
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
        const price = 11;
        const imageSent = yield (0, msg_1.sendImage)(t, node1, node2, image, tribe, price);
        t.true(!!imageSent, 'message should have been sent');
        //NODE2 SENDS AN IMAGE TO NODE1
        const image2 = base64images_1.pinkSquare;
        const price2 = 12;
        const imageSent2 = yield (0, msg_1.sendImage)(t, node2, node1, image2, tribe, price2);
        t.true(!!imageSent2, 'message should have been sent');
        //NODE2 LEAVES TRIBE
        let left2 = yield (0, del_1.leaveTribe)(t, node2, tribe);
        t.true(left2, 'node2 should leave tribe');
        //NODE1 DELETES TRIBE
        let delTribe2 = yield (0, del_1.deleteTribe)(t, node1, tribe);
        t.true(delTribe2, 'node1 should delete tribe');
    });
}
exports.paidTribeImages = paidTribeImages;
//# sourceMappingURL=paidTribeImages.test.js.map