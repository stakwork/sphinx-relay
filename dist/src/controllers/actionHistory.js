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
exports.saveActionBulk = exports.saveAction = void 0;
const models_1 = require("../models");
const res_1 = require("../utils/res");
const helpers_1 = require("../helpers");
function saveAction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { type, meta_data } = req.body;
        if (!type)
            return (0, res_1.failure)(res, 'invalid type');
        if (!meta_data)
            return (0, res_1.failure)(res, 'invalid meta_data');
        try {
            yield models_1.models.ActionHistory.create({
                tenant,
                metaData: JSON.stringify(meta_data),
                type,
            });
            return (0, res_1.success)(res, 'Action saved successfully');
        }
        catch (error) {
            console.log(error);
            return (0, res_1.failure)(res, 'sorry an error occured');
        }
    });
}
exports.saveAction = saveAction;
function saveActionBulk(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { data } = req.body;
        if (!Array.isArray(data))
            return (0, res_1.failure)(res, 'invalid data');
        if (data.length === 0)
            return (0, res_1.failure)(res, 'Please provide an array with contents');
        const insertAction = (value) => __awaiter(this, void 0, void 0, function* () {
            if (value.type && value.meta_data) {
                try {
                    yield models_1.models.ActionHistory.create({
                        tenant,
                        metaData: JSON.stringify(value.meta_data),
                        type: value.type,
                    });
                }
                catch (error) {
                    console.log(error);
                    throw error;
                }
            }
            else {
                throw 'Please provide valid data';
            }
        });
        try {
            yield (0, helpers_1.asyncForEach)(data, insertAction);
            return (0, res_1.success)(res, 'Data saved successfully');
        }
        catch (error) {
            console.log(error);
            return (0, res_1.failure)(res, error);
        }
    });
}
exports.saveActionBulk = saveActionBulk;
//# sourceMappingURL=actionHistory.js.map