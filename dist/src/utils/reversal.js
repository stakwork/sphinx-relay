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
exports.reversal = void 0;
const models_1 = require("../models");
const socket = require("./socket");
const constants_1 = require("../constants");
const jsonUtils = require("./json");
function reversal({ tenant, type, errorMsg, msgUuid, chat, sender, }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield models_1.models.Message.update({
            errorMessage: errorMsg,
            status: constants_1.default.statuses.failed,
        }, {
            where: { tenant, uuid: msgUuid },
        });
        const updatedPrevMsg = (yield models_1.models.Message.findOne({
            where: { tenant, uuid: msgUuid },
        }));
        socket.sendJson({
            type,
            response: jsonUtils.messageToJson(updatedPrevMsg, chat, sender),
        }, tenant);
        return;
    });
}
exports.reversal = reversal;
//# sourceMappingURL=reversal.js.map