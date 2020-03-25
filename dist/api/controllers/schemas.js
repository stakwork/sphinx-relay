"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup = require("yup");
/*
These schemas validate payloads coming from app,
do not necessarily match up with Models
*/
const attachment = yup.object().shape({
    muid: yup.string().required(),
    media_type: yup.string().required(),
    media_key_map: yup.object().required(),
});
exports.attachment = attachment;
const message = yup.object().shape({
    contact_id: yup.number().required(),
});
exports.message = message;
const purchase = yup.object().shape({
    chat_id: yup.number().required(),
    contact_id: yup.number().required(),
    mediaToken: yup.string().required(),
    amount: yup.number().required()
});
exports.purchase = purchase;
//# sourceMappingURL=schemas.js.map