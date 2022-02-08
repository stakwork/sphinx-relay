"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const name = 'evan';
var nodes = require(`./configs/${name}.json`);
const configs = [];
for (const n of nodes) {
    configs.push(n);
}
exports.default = configs;
//# sourceMappingURL=nodes.js.map