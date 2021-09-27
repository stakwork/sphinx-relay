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
exports.makeRelayRequest = exports.makeArgs = void 0;
const http = require("ava-http");
const makeArgs = (node, body = {}) => {
    return {
        headers: { 'x-user-token': node.authToken },
        body,
    };
};
exports.makeArgs = makeArgs;
const makeRelayRequest = (method, path, node, body
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) => __awaiter(void 0, void 0, void 0, function* () {
    const reqFunc = http[method];
    const { response } = yield reqFunc(node.external_ip + path, exports.makeArgs(node, body));
    return response;
});
exports.makeRelayRequest = makeRelayRequest;
//# sourceMappingURL=helpers.js.map