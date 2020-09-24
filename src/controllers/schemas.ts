import * as yup from 'yup'

/*
These schemas validate payloads coming from app,
do not necessarily match up with Models
*/

export const attachment = yup.object().shape({
    muid: yup.string().required(),
    media_type: yup.string().required(),
    media_key_map: yup.object().required(),
})

export const message = yup.object().shape({
    contact_id: yup.number().required(),
})

export const purchase = yup.object().shape({
    chat_id: yup.number().required(),
    contact_id: yup.number().required(),
    media_token: yup.string().required(),
    amount: yup.number().required()
})
