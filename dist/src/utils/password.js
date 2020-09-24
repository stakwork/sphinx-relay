"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const password = crypto.randomBytes(16).toString('hex');
exports.default = password;
//# sourceMappingURL=password.js.map