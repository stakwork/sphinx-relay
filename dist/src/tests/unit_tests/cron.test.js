"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron_1 = require("../../utils/cron");
const parser = require("cron-parser");
describe('Testing the cron job time function', () => {
    const now = new Date();
    const minute = now.getMinutes();
    const hour = now.getHours();
    const dayOfMonth = now.getDate();
    const dayOfWeek = now.getDay();
    test('Testing Cron Jobs time', () => {
        expect((0, cron_1.make)('daily')).toStrictEqual(`${minute} ${hour} * * *`);
        expect((0, cron_1.make)('weekly')).toStrictEqual(`${minute} ${hour} * * ${dayOfWeek}`);
        expect((0, cron_1.make)('monthly')).toStrictEqual(`${minute} ${hour} ${dayOfMonth} * *`);
    });
    function parseNext(s) {
        const interval = parser.parseExpression(s);
        return interval.next().toString();
    }
    const daily = '40 4 * * *';
    const weekly = '45 3 * * 4';
    const monthly = '50 2 5 * *';
    test('Parsing Cron string', () => {
        expect((0, cron_1.parse)(daily)).toStrictEqual({
            interval: 'daily',
            next: parseNext(daily),
            ms: 86400000,
        });
        expect((0, cron_1.parse)(weekly)).toStrictEqual({
            interval: 'weekly',
            next: parseNext(weekly),
            ms: 86400000 * 7,
        });
        expect((0, cron_1.parse)(monthly)).toStrictEqual({
            interval: 'monthly',
            next: parseNext(monthly),
            ms: 86400000 * 30,
        });
    });
});
//# sourceMappingURL=cron.test.js.map