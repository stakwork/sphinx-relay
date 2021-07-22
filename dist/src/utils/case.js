"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCamel = exports.toSnake = void 0;
const changeCase = require("change-case");
const dateKeys = ['date', 'createdAt', 'updatedAt', 'created_at', 'updated_at'];
const boolKeys = [
    'fromGroup',
    'isOwner',
    'deleted',
    'seen',
    'isMuted',
    'unlisted',
    'private',
    'privatePhoto',
    'skipBroadcastJoins',
];
function toSnake(obj) {
    const ret = {};
    for (let [key, value] of Object.entries(obj)) {
        if (dateKeys.includes(key) && value) {
            const v = value;
            let d = new Date(v);
            if (isNaN(d.getTime()))
                d = new Date();
            ret[changeCase.snakeCase(key)] = d.toISOString();
        }
        else if (boolKeys.includes(key)) {
            ret[changeCase.snakeCase(key)] = !value || value === '0' ? 0 : 1;
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