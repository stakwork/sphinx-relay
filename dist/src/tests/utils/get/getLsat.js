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
exports.getLsat = void 0;
const helpers_1 = require("../helpers");
const getLsat = (t, node, identifier) => __awaiter(void 0, void 0, void 0, function* () {
    const { lsat } = yield (0, helpers_1.makeRelayRequest)('get', `/lsats/${identifier}`, node);
    t.assert(lsat.identifier === identifier, 'lsat did not match identifier');
    return lsat;
});
exports.getLsat = getLsat;
//# sourceMappingURL=getLsat.js.map