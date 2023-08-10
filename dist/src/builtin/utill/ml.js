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
exports.addUrl = void 0;
const index_1 = require("./index");
function addUrl(bot, meta, botName, botPrefix, tribe, cmd, messageObj, newUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!newUrl) {
            yield (0, index_1.botResponse)(botName, 'Please provide a valid URL', botPrefix, tribe.id, messageObj, cmd);
            return;
        }
        meta.url = newUrl;
        yield bot.update({ meta: JSON.stringify(meta) });
        yield (0, index_1.botResponse)(botName, 'URL updated successfully', botPrefix, tribe.id, messageObj, cmd);
        return;
    });
}
exports.addUrl = addUrl;
//# sourceMappingURL=ml.js.map