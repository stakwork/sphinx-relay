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
exports.pinMsgToTribe = void 0;
const http = require("ava-http");
const helpers_1 = require("../helpers");
const get_1 = require("../get");
function pinMsgToTribe(t, node, id, pin) {
    return __awaiter(this, void 0, void 0, function* () {
        //node1 creates new tribe
        let c = yield http.put(node.external_ip + '/chat_pin/' + id, helpers_1.makeArgs(node, { pin }));
        //check that new tribe was created successfully
        t.true(c.success, 'edit tribe pin should be successful');
        //get new tribe by Id
        const r = yield get_1.getCheckTribe(t, node, id);
        //check that the chat was found
        t.true(typeof r === 'object', 'the newly created chat should be found');
        // pin updated on relay
        t.true(r.pin === pin, 'chat pin does not equal');
        const tribe = yield get_1.getTribeByUuid(t, r);
        // pin updated on tribes server
        t.true(tribe.pin === pin, 'pin does not equal');
        return tribe.pin;
    });
}
exports.pinMsgToTribe = pinMsgToTribe;
//# sourceMappingURL=pinMsg.js.map