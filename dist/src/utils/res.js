"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unauthorized = exports.failure200 = exports.failure = exports.success = void 0;
const logger_1 = require("./logger");
function success(res, json) {
    res.status(200);
    res.json({
        success: true,
        response: json,
    });
    res.end();
}
exports.success = success;
function failure(res, e) {
    const errorMessage = (e && e.message) || e;
    logger_1.sphinxLogger.error(`--> failure: ${errorMessage}`);
    res.status(400);
    res.json({
        success: false,
        error: errorMessage,
    });
    res.end();
}
exports.failure = failure;
function failure200(res, e) {
    res.status(200);
    res.json({
        success: false,
        error: (e && e.message) || e,
    });
    res.end();
}
exports.failure200 = failure200;
function unauthorized(res) {
    res.status(401);
    res.json({ success: false, error: 'Invalid credentials' });
    res.end();
}
exports.unauthorized = unauthorized;
//# sourceMappingURL=res.js.map