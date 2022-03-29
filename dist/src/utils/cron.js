"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.make = exports.parse = void 0;
const parser = require("cron-parser");
function daily() {
    const now = new Date();
    const minute = now.getMinutes();
    const hour = now.getHours();
    return `${minute} ${hour} * * *`;
}
function weekly() {
    const now = new Date();
    const minute = now.getMinutes();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    return `${minute} ${hour} * * ${dayOfWeek}`;
}
function monthly() {
    const now = new Date();
    const minute = now.getMinutes();
    const hour = now.getHours();
    const dayOfMonth = now.getDate();
    return `${minute} ${hour} ${dayOfMonth} * *`;
}
function parse(s) {
    const interval = parser.parseExpression(s);
    const next = interval.next().toString();
    if (s.endsWith(' * * *')) {
        return { interval: 'daily', next, ms: 86400000 };
    }
    if (s.endsWith(' * *')) {
        return { interval: 'monthly', next, ms: 86400000 * 30 };
    }
    return { interval: 'weekly', next, ms: 86400000 * 7 };
}
exports.parse = parse;
function make(interval) {
    if (interval === 'daily')
        return daily();
    if (interval === 'weekly')
        return weekly();
    if (interval === 'monthly')
        return monthly();
}
exports.make = make;
//# sourceMappingURL=cron.js.map