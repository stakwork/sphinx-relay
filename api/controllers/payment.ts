import {models} from '../models'
import { sendNotification } from '../hub'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as helpers from '../helpers'
import { success } from '../utils/res'
import * as lightning from '../utils/lightning'
import {tokenFromTerms} from '../utils/ldat'

const constants = require(__dirname + '/../../config/constants.json');

const sendPayment = async (req, res) => {
  const { 
    amount,
    chat_id,
    contact_id,
    destination_key,
    media_type,
    muid,
    text,
    remote_text,
    dimensions,
  } = req.body

  console.log('[send payment]', req.body)

  if (destination_key && !contact_id && !chat_id) {
    return helpers.performKeysendMessage({
      destination_key, 
      amount,
      msg:'{}',
      success: () => {
        console.log('payment sent!')
        success(res, {destination_key, amount})
      },
      failure: (error) => {
        res.status(200);
        res.json({ success: false, error });
        res.end();
      }
    })
  }

  const owner = await models.Contact.findOne({ where: { isOwner: true }})

  const chat = await helpers.findOrCreateChat({
    chat_id,
    owner_id: owner.id,
    recipient_id: contact_id
  })

  var date = new Date();
  date.setMilliseconds(0)

  const msg: {[k:string]:any} = {
    chatId: chat.id,
    sender: owner.id,
    type: constants.message_types.direct_payment,
    amount: amount,
    amountMsat: parseFloat(amount) * 1000,
    date: date,
    createdAt: date,
    updatedAt: date
  }
  if(text) msg.messageContent = text
  if(remote_text) msg.remoteMessageContent = remote_text

  if(muid){
    const myMediaToken = await tokenFromTerms({
      meta:{dim:dimensions}, host:'',
      muid, ttl:null, // default one year
      pubkey: owner.publicKey
    })
    msg.mediaToken = myMediaToken
    msg.mediaType = media_type || ''
  }

  const message = await models.Message.create(msg)

  const msgToSend: {[k:string]:any} = {
    id:message.id,
    amount,
  }
  if(muid) {
    msgToSend.mediaType = media_type||'image/jpeg'
    msgToSend.mediaTerms = {muid,meta:{dim:dimensions}}
  }
  if(remote_text) msgToSend.content = remote_text

  helpers.sendMessage({
    chat: chat,
    sender: owner,
    type: constants.message_types.direct_payment,
    message: msgToSend,
    amount: amount,
    success: async (data) => {
      // console.log('payment sent', { data })
      success(res, jsonUtils.messageToJson(message, chat))
    },
    failure: (error) => {
      res.status(200);
      res.json({ success: false, error });
      res.end();
    }
  })
};

const receivePayment = async (payload) => {
  console.log('received payment', { payload })

  var date = new Date();
  date.setMilliseconds(0)

  const {owner, sender, chat, amount, content, mediaType, mediaToken} = await helpers.parseReceiveParams(payload)
  if(!owner || !sender || !chat) {
    return console.log('=> no group chat!')
  }

  const msg: {[k:string]:any} = {
    chatId: chat.id,
    type: constants.message_types.direct_payment,
    sender: sender.id,
    amount: amount,
    amountMsat: parseFloat(amount) * 1000,
    date: date,
    createdAt: date,
    updatedAt: date
  }
  if(content) msg.messageContent = content
  if(mediaType) msg.mediaType = mediaType
  if(mediaToken) msg.mediaToken = mediaToken
  
  const message = await models.Message.create(msg)

  console.log('saved message', message.dataValues)

  socket.sendJson({
    type: 'direct_payment',
    response: jsonUtils.messageToJson(message, chat)
  })

  sendNotification(chat, sender.alias, 'message')
}

const listPayments = async (req, res) => {
  const limit = (req.query.limit && parseInt(req.query.limit)) || 100
  const offset = (req.query.offset && parseInt(req.query.offset)) || 0
  
  const payments: any[] = []

  const response:any = await lightning.listInvoices()
  const invs = response && response.invoices
  if(invs && invs.length){
    invs.forEach(inv=>{
      const val = inv.value && parseInt(inv.value)
      if(val && val>1) {
        let payment_hash=''
        if(inv.r_hash){
          payment_hash = Buffer.from(inv.r_hash).toString('hex')
        }
        payments.push({
          type:'invoice',
          amount:parseInt(inv.value), 
          date:parseInt(inv.creation_date),
          payment_request:inv.payment_request,
          payment_hash
        })
      }
    })
  }

  const res2:any = await lightning.listPayments()
  const pays = res2 && res2.payments
  if(pays && pays.length){
    pays.forEach(pay=>{
      const val = pay.value && parseInt(pay.value)
      if(val && val>1) {
        payments.push({
          type:'payment',
          amount:parseInt(pay.value),
          date:parseInt(pay.creation_date),
          pubkey:pay.path[pay.path.length-1],
          payment_hash: pay.payment_hash,
        })
      }
    })
  }

  // latest one first
  payments.sort((a,b)=> b.date - a.date)

  success(res, payments.splice(offset, limit))
};

export {
  sendPayment,
  receivePayment,
  listPayments,
}
