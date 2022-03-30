import { models } from '../models'
import * as path from 'path'
import { loadConfig } from '../utils/config'
import { Req } from '../types'
import * as multer from 'multer'

const config = loadConfig()

// setup disk storage
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = __dirname.includes('/dist/')
      ? path.join(__dirname, '..')
      : __dirname
    cb(null, dir + '/../../public/uploads')
  },
  filename: (req, file, cb) => {
    const mime = file.mimetype
    const extA = mime.split('/')
    const ext = extA[extA.length - 1]
    if (req.body.chat_id) {
      cb(null, `chat_${req.body.chat_id}_picture.${ext}`)
    } else {
      cb(null, `${req.body.contact_id}_profile_picture.${ext}`)
    }
  },
})
export const avatarUpload = multer({ storage: avatarStorage })

function hasProtocol(ip) {
  if (ip.startsWith('https://')) return true
  if (ip.startsWith('http://')) return true
  return false
}

interface UploadReq extends Req {
  file: any
}

export const uploadFile = async (req: UploadReq, res) => {
  const { contact_id, chat_id } = req.body
  const { file } = req

  const ip = String(process.env.NODE_IP)
  let theIP = ip
  if (!hasProtocol(ip)) {
    theIP = config.node_http_protocol + '://' + ip
  }
  const photo_url = theIP + '/static/uploads/' + file.filename

  if (contact_id) {
    const contact = await models.Contact.findOne({ where: { id: contact_id } })
    if (contact) contact.update({ photoUrl: photo_url })
  }

  if (chat_id) {
    const chat = await models.Chat.findOne({ where: { id: chat_id } })
    if (chat) chat.update({ photoUrl: photo_url })
  }

  res.status(200)
  res.json({
    success: true,
    contact_id: parseInt(contact_id || 0),
    chat_id: parseInt(chat_id || 0),
    photo_url,
  })
  res.end()
}
