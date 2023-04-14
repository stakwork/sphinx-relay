"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errMsgString = void 0;
function errMsgString(error) {
    let errMsg = '';
    if (typeof error === 'string') {
        errMsg = error;
    }
    else {
        errMsg = error === null || error === void 0 ? void 0 : error.message;
    }
    return errMsg;
}
exports.errMsgString = errMsgString;
//# sourceMappingURL=errMsgString.js.map