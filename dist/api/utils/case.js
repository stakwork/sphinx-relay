"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const changeCase = require("change-case");
const dateKeys = ['date', 'createdAt', 'updatedAt', 'created_at', 'updated_at'];
function toSnake(obj) {
    const ret = {};
    for (let [key, value] of Object.entries(obj)) {
        if (dateKeys.includes(key) && value) {
            const v = value;
            const d = new Date(v);
            ret[changeCase.snakeCase(key)] = d.toISOString();
        }
        else {
            ret[changeCase.snakeCase(key)] = value;
        }
    }
    return ret;
}
exports.toSnake = toSnake;
function toCamel(obj) {
    const ret = {};
    for (let [key, value] of Object.entries(obj)) {
        ret[changeCase.camelCase(key)] = value;
    }
    return ret;
}
exports.toCamel = toCamel;
//# sourceMappingURL=case.js.map