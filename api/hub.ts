import {models} from './models'
import * as fetch from 'node-fetch'
import { Op } from 'sequelize'
import * as socket from './utils/socket'
import * as jsonUtils from './utils/json'
import * as helpers from './helpers'
import {nodeinfo} from './utils/nodeinfo'
import { loadLightning } from './utils/lightning'
import * as path from 'path'

const constants = require(path.join(__dirname, '../config/constants.json'))
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname,'../config/app.json'))[env];

const checkInviteHub = async (params = {}) => {
  if (env != "production") {
    return
  }
  const owner = await models.Contact.findOne({ where: { isOwner: true }})

  //console.log('[hub] checking invites ping')

  const inviteStrings = await models.Invite.findAll({ where: { status: { [Op.notIn]: [constants.invite_statuses.complete, constants.invite_statuses.expired] } } }).map(invite => invite.inviteString)
  if(inviteStrings.length===0) {
    return // skip if no invites
  }

  fetch(config.hub_api_url + '/invites/check', {
    method: 'POST' ,
    body:    JSON.stringify({ invite_strings: inviteStrings }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(json => {
    if (json.object) {
      json.object.invites.map(async object => {
        const invite = object.invite
        const pubkey = object.pubkey
        const price = object.price

        const dbInvite = await models.Invite.findOne({ where: { inviteString: invite.pin }})
        const contact = await models.Contact.findOne({ where: { id: dbInvite.contactId } })

        if (dbInvite.status != invite.invite_status) {
          const updateObj:{[k:string]:any} = { status: invite.invite_status, price: price }
          if(invite.invoice) updateObj.invoice = invite.invoice

          dbInvite.update(updateObj)
          
          socket.sendJson({
            type: 'invite',
            response: jsonUtils.inviteToJson(dbInvite)
          })

          if (dbInvite.status == constants.invite_statuses.ready && contact) {
            sendNotification(-1, contact.alias, 'invite')
          }
        }

        if (pubkey && dbInvite.status == constants.invite_statuses.complete && contact) {
          contact.update({ publicKey: pubkey, status: constants.contact_statuses.confirmed })

          var contactJson = jsonUtils.contactToJson(contact)
          contactJson.invite = jsonUtils.inviteToJson(dbInvite)
          
          socket.sendJson({
            type: 'contact',
            response: contactJson
          })

          helpers.sendContactKeys({
            contactIds: [contact.id],
            sender: owner,
            type: constants.message_types.contact_key,
          })
        }
      })
    }
  })
  .catch(error => {
    console.log('[hub error]', error)
  })
}

const pingHub = async (params = {}) => {
  if (env != "production") {
    return
  }

  const node = await nodeinfo()
  sendHubCall({ ...params, node })
}

const sendHubCall = (params) => {
  // console.log('[hub] sending ping')
  fetch(config.hub_api_url + '/ping', {
    method: 'POST',
    body:    JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' }
  })
  .catch(error => {
    console.log('[hub warning]: cannot reach hub',)
  })
}

const pingHubInterval = (ms) => {
  setInterval(pingHub, ms)
}

const checkInvitesHubInterval = (ms) => {
  setInterval(checkInviteHub, ms)
}

export function sendInvoice(payReq, amount) {
  console.log('[hub] sending invoice')
  fetch(config.hub_api_url + '/invoices', {
    method: 'POST',
    body:    JSON.stringify({invoice:payReq, amount}),
    headers: { 'Content-Type': 'application/json' }
  })
  .catch(error => {
    console.log('[hub error]: sendInvoice', error)
  })
}

const finishInviteInHub = (params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + '/invites/finish', {
    method: 'POST' ,
    body:    JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(json => {
    console.log('[hub] finished invite to hub')
    onSuccess(json)
  })
  .catch(e => {
    console.log('[hub] fail to finish invite in hub')
    onFailure(e)
  })
}

const payInviteInHub = (invite_string, params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + '/invites/' + invite_string + '/pay', {
    method: 'POST' ,
    body:    JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(json => {
    if (json.object) {
      console.log('[hub] finished pay to hub')
      onSuccess(json)
    } else {
      console.log('[hub] fail to pay invite in hub')
      onFailure(json)
    }
  })
}

async function payInviteInvoice(invoice, onSuccess, onFailure) {
  const lightning = await loadLightning()
  var call = lightning.sendPayment({})
  call.on('data', async response => {
    onSuccess(response)
  })
  call.on('error', async err => {
    onFailure(err)
  })
  call.write({ payment_request:invoice })
}

const createInviteInHub = (params, onSuccess, onFailure) => {
  fetch(config.hub_api_url + '/invites_new', {
    method: 'POST' ,
    body:    JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(json => {
    if (json.object) {
      console.log('[hub] sent invite to be created to hub')
      onSuccess(json)
    } else {
      console.log('[hub] fail to create invite in hub')
      onFailure(json)
    }
  })
}

type NotificationType = 'group' | 'badge' | 'invite' | 'message' | 'reject'

const sendNotification = async (chat, name, type:NotificationType) => {
  
  let message = `You have a new message from ${name}`
  if(type==='invite'){
    message = `Your invite to ${name} is ready`
  }
  if(type==='group'){
    message = `You have been added to group ${name}`
  }
  if(type==='reject') {
    message = `The admin has declined your request to join "${name}"`
  }

  if(type==='message' && chat.type==constants.chat_types.group && chat.name && chat.name.length){
    message += ` on ${chat.name}`
  }

  const owner = await models.Contact.findOne({ where: { isOwner: true }})

  if (!owner.deviceId) {
    console.log('[send notification] skipping. owner.deviceId not set.')
    return
  }
  const device_id = owner.deviceId
  const isIOS = device_id.length===64
  const isAndroid = !isIOS
  
  const params:{[k:string]:any} = {device_id}
  const notification:{[k:string]:any} = {
    chat_id: chat.id,
    sound: ''
  }
  if(type!=='badge' && !chat.isMuted) {
    notification.message = message
    notification.sound = owner.notificationSound || 'default'
  } else {
    if(isAndroid) return // skip on Android if no actual message
  }
  params.notification = notification

  if(type==='message' && chat.type==constants.chat_types.tribe){
    debounce(()=>{
      const count = tribeCounts[chat.id]?tribeCounts[chat.id]+' ':''
      params.notification.message = chat.isMuted ? '' : `You have ${count}new messages in ${chat.name}`
      finalNotification(owner.id, params)
    }, chat.id, 30000)
  } else {
    finalNotification(owner.id, params)
  }
}

async function finalNotification(ownerID: number, params:{[k:string]:any}){
  if(params.notification.message) {
    console.log('[send notification]', params.notification)
  }
  let unseenMessages = await models.Message.count({ where: { sender: { [Op.ne]: ownerID }, seen: false } })
  params.notification.badge = unseenMessages
  triggerNotification(params)
}

function triggerNotification(params:{[k:string]:any}){
  fetch("https://hub.sphinx.chat/api/v1/nodes/notify", {
    method: 'POST' ,
    body:    JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' }
  })
  .catch(error => {
    console.log('[hub error]: triggerNotification', error)
  })
}

export {
  pingHubInterval,
  checkInvitesHubInterval,
  sendHubCall,
  sendNotification,
  createInviteInHub,
  finishInviteInHub,
  payInviteInHub,
  payInviteInvoice
}

// let inDebounce
// function debounce(func, delay) {
//   const context = this
//   const args = arguments
//   clearTimeout(inDebounce)
//   inDebounce = setTimeout(() => func.apply(context, args), delay)
// }

const bounceTimeouts={}
const tribeCounts = {}
function debounce(func, id, delay) {
  const context = this
  const args = arguments
  if(bounceTimeouts[id]) clearTimeout(bounceTimeouts[id])
  if(!tribeCounts[id]) tribeCounts[id]=0
  tribeCounts[id]+=1
  bounceTimeouts[id] = setTimeout(() => {
    func.apply(context, args)
    // setTimeout(()=> tribeCounts[id]=0, 15)
    tribeCounts[id]=0
  }, delay)
}
