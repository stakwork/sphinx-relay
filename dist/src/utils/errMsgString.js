"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errMsgString = void 0;
function errMsgString(error) {
    let errMsg = '';
    if (!error)
        return 'failure';
    if (typeof error === 'string') {
        errMsg = error;
    }
    else if (error.toString) {
        errMsg = error.toString();
    }
    else {
        errMsg = error === null || error === void 0 ? void 0 : error.message;
    }
    if (errMsg === 'FAILURE_REASON_NO_ROUTE') {
        errMsg = 'no route found';
    }
    if (errMsg === 'FAILURE_REASON_INSUFFICIENT_BALANCE') {
        errMsg = 'insufficient balance';
    }
    if (errMsg === 'FAILURE_REASON_INCORRECT_PAYMENT_DETAILS') {
        errMsg = 'incorrect payment details';
    }
    return errMsg;
}
exports.errMsgString = errMsgString;
//# sourceMappingURL=errMsgString.js.map