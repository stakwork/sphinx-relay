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
exports.saveRecurringCall = void 0;
const models_1 = require("../../models");
function saveRecurringCall({ link, title, description, tribe, tenant, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!tribe.callRecording ||
            !tribe.jitsiServer ||
            !tribe.memeServerLocation ||
            !tribe.stakworkApiKey ||
            !tribe.stakworkWebhook ||
            tribe.jitsiServer !== validateJitsiServer(link, tribe.jitsiServer)) {
            return {
                status: false,
                errMsg: 'Please configure tribe for call recording',
            };
        }
        yield models_1.models.RecurringCall.create({
            link: link.split('#')[0],
            title,
            description,
            chatId: tribe.id,
            tenant,
            deleted: false,
        });
        return { status: true };
    });
}
exports.saveRecurringCall = saveRecurringCall;
const validateJitsiServer = (link, tribeJitsi) => {
    return link.substring(0, tribeJitsi.length);
};
//# sourceMappingURL=callRecording.js.map