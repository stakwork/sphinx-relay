"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const changeCase = require("change-case");
const dateKeys = ['date', 'createdAt', 'updatedAt', 'created_at', 'updated_at'];
const boolKeys = ['from_group', 'is_owner', 'deleted'];
function toSnake(obj) {
    const ret = {};
    for (let [key, value] of Object.entries(obj)) {
        if (dateKeys.includes(key) && value) {
            const v = value;
            const d = new Date(v);
            ret[changeCase.snakeCase(key)] = d.toISOString();
        }
        else if (boolKeys.includes(key)) {
            ret[changeCase.snakeCase(key)] = (!value || value === '0') ? 0 : 1;
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