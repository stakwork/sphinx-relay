"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    res.status(400);
    res.json({
        success: false,
        error: (e && e.message) || e,
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
//# sourceMappingURL=res.js.map