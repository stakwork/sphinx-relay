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
exports.storeData = void 0;
const res_1 = require("../utils/res");
const models_1 = require("../models");
function storeData(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { boost, date, description, episode_title, guest, image_url, keyword, link, node_type, ref_id, show_title, text, timestamp, topics, type, weight, } = req.body;
        try {
            let existing = undefined;
            existing = (yield models_1.models.LocalData.findOne({
                where: {
                    refId: ref_id,
                    tenant,
                },
            }));
            if (existing) {
                existing.increment({ searchFrequency: 1 });
                console.log('incremented Successfully');
                return (0, res_1.success)(res, 'Data Stored');
            }
            const savedLocalData = yield models_1.models.LocalData.create({
                boost,
                date,
                description,
                episodeTile: episode_title,
                guest: JSON.stringify(guest),
                imageUrl: image_url,
                keyword,
                link,
                nodeType: node_type,
                showTitle: show_title,
                text,
                timestamp,
                topics: JSON.stringify(topics),
                type,
                weight,
                tenant,
                refId: ref_id,
            });
            console.log(savedLocalData);
            return (0, res_1.success)(res, 'Data Stored');
        }
        catch (error) {
            console.log(error);
            return (0, res_1.failure)(res, 'Internal Server Error');
        }
    });
}
exports.storeData = storeData;
//# sourceMappingURL=localData.js.map