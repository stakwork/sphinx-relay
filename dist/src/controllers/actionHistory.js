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
const constants_1 = require("../constants");
/**

    @param {Req} req
    @param {Response} res
    @returns {Promise<void>}
    */
function saveAction(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { type, meta_data } = req.body;
        const actionTypes = Object.keys(constants_1.default.action_types);
        if (typeof type !== 'number' || !actionTypes[type])
            return (0, res_1.failure)(res, 'invalid type');
        if (!meta_data)
            return (0, res_1.failure)(res, 'invalid meta_data');
        try {
            yield models_1.models.ActionHistory.create({
                tenant,
                metaData: JSON.stringify(meta_data),
                actionType: type,
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
/**
 * This function saves an action to the database.

@param {Req} req - The request object containing information about the request made to the server.
@param {Response} res - The response object used to send a response back to the client.

@return {Promise<void>} - A promise that resolves when the function completes, or rejects if an error occurs. If successful, the response will contain a message indicating that the action was saved successfully. If there is an error, the response will contain an error message.
*/
function saveActionBulk(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.owner)
            return (0, res_1.failure)(res, 'no owner');
        const tenant = req.owner.id;
        const { data } = req.body;
        console.log(data);
        const actionTypes = Object.keys(constants_1.default.action_types);
        if (!Array.isArray(data))
            return (0, res_1.failure)(res, 'invalid data');
        if (data.length === 0)
            return (0, res_1.failure)(res, 'Please provide an array with contents');
        const insertAction = (value) => __awaiter(this, void 0, void 0, function* () {
            if (typeof value.type === 'number' &&
                actionTypes[value.type] &&
                value.meta_data) {
                try {
                    yield models_1.models.ActionHistory.create({
                        tenant,
                        metaData: JSON.stringify(value.meta_data),
                        actionType: value.type,
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