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
exports.iterate = exports.asyncForEach = exports.randomText = exports.makeRelayRequest = exports.makeArgs = void 0;
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
function randomText() {
    const text = Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')
        .substr(0, 5);
    return text;
}
exports.randomText = randomText;
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
exports.asyncForEach = asyncForEach;
function iterate(nodes, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const already = [];
        yield asyncForEach(nodes, (n1) => __awaiter(this, void 0, void 0, function* () {
            yield asyncForEach(nodes, (n2) => __awaiter(this, void 0, void 0, function* () {
                if (n1.pubkey !== n2.pubkey) {
                    if (!already.find((a) => {
                        a.includes(n1.pubkey) && a.includes(n2.pubkey);
                    })) {
                        already.push(`${n1.pubkey}-${n2.pubkey}`);
                        yield callback(n1, n2);
                    }
                }
            }));
        }));
    });
}
exports.iterate = iterate;
//# sourceMappingURL=helpers.js.map