"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageDiff = void 0;
const config_1 = require("../../config");
const getMessageDiff = (t, noCacheMsg, cacheMsg) => __awaiter(void 0, void 0, void 0, function* () {
    const missingField = ['created_at', 'updated_at'];
    if (config_1.config.cache) {
        if (cacheMsg.cached && noCacheMsg.cached === undefined) {
            for (let key in noCacheMsg) {
                if (key !== 'chat') {
                    // created_at and updated_at are always null
                    if (cacheMsg[key] === undefined) {
                        missingField.push(key);
                    }
                }
            }
            return missingField;
        }
        else {
            return false;
        }
    }
    return true;
});
exports.getMessageDiff = getMessageDiff;
//# sourceMappingURL=getMessageDiff.js.map