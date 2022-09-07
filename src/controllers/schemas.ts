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
  amount: yup.number().required(),
})

export const mediaData = yup.object().shape({
  boost: yup.number().required(),
  date: yup.number().required(),
  description: yup.string().required(),
  episode_title: yup.string().required(),
  guests: yup.array().required(),
  image_url: yup.string().required(),
  keyword: yup.boolean().required(),
  link: yup.string().required(),
  node_type: yup.string().required(),
  ref_id: yup.string().required(),
  show_title: yup.string().required(),
  text: yup.string().required(),
  timestamp: yup.string().required(),
  topics: yup.array().required(),
  type: yup.string().required(),
  weight: yup.string().required(),
})
