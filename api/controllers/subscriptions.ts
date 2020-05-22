import {models} from '../models'
import {success, failure} from '../utils/res'
import {CronJob} from 'cron'
import {toCamel} from '../utils/case'
import * as cronUtils from '../utils/cron'
import * as socket from '../utils/socket'
import * as jsonUtils from '../utils/json'
import * as helpers from '../helpers'
import * as rsa from '../crypto/rsa'
import * as moment from 'moment'
import * as path from 'path'
import * as network from '../network'

const constants = require(path.join(__dirname,'../../config/constants.json'))

// store all current running jobs in memory
let jobs = {}

// init jobs from DB
const initializeCronJobs = async () => {
  await helpers.sleep(1000)
  const subs = await getRawSubs({ where: { ended: false } })
  subs.length && subs.forEach(sub => {
    console.log("=> starting subscription cron job",sub.id+":",sub.cron)
    startCronJob(sub)
  })
}

async function startCronJob(sub) {
  jobs[sub.id] = new CronJob(sub.cron, async function () {
    const subscription = await models.Subscription.findOne({ where: { id: sub.id } })
    if (!subscription) {
      delete jobs[sub.id]
      return this.stop()
    }

    console.log('EXEC CRON =>', subscription.id)
    if (subscription.paused) { // skip, still in jobs{} tho
      return this.stop()
    }
    let STOP = checkSubscriptionShouldAlreadyHaveEnded(subscription)
    if (STOP) { // end the job and return
      console.log("stop")
      subscription.update({ ended: true })
      delete jobs[subscription.id]
      return this.stop()
    }
    // SEND PAYMENT!!!
    sendSubscriptionPayment(subscription, false)
  }, null, true);
}

function checkSubscriptionShouldAlreadyHaveEnded(sub) {
  if (sub.endDate) {
    const now = new Date()
    if (now.getTime() > sub.endDate.getTime()) {
      return true
    }
  }
  if (sub.endNumber) {
    if (sub.count >= sub.endNumber) {
      return true
    }
  }
  return false
}

function checkSubscriptionShouldEndAfterThisPayment(sub) {
  if (sub.endDate) {
    const { ms } = cronUtils.parse(sub.cron)
    const now = new Date()
    if ((now.getTime() + ms) > sub.endDate.getTime()) {
      return true
    }
  }
  if (sub.endNumber) {
    if (sub.count + 1 >= sub.endNumber) {
      return true
    }
  }
  return false
}

function msgForSubPayment(owner, sub, isFirstMessage, forMe){
  let text = ''
  if (isFirstMessage) {
    const alias = forMe ? 'You' : owner.alias
    text = `${alias} subscribed\n`
  } else {
    text = 'Subscription\n'
  }
  text += `Amount: ${sub.amount} sats\n`
  text += `Interval: ${cronUtils.parse(sub.cron).interval}\n`
  if(sub.endDate) {
    text += `End: ${moment(sub.endDate).format('MM/DD/YY')}\n`
    text += `Status: ${sub.count+1} sent`
  } else if(sub.endNumber) {
    text += `Status: ${sub.count+1} of ${sub.endNumber} sent`
  }
  return text
}

async function sendSubscriptionPayment(sub, isFirstMessage) {
  const owner = await models.Contact.findOne({ where: { isOwner: true } })

  var date = new Date();
  date.setMilliseconds(0)

  const subscription = await models.Subscription.findOne({ where: { id: sub.id } })
  if (!subscription) {
    return
  }
  const chat = await models.Chat.findOne({ where: {id:subscription.chatId} })
  if (!subscription) {
    console.log("=> no sub for this payment!!!")
    return
  }

  const forMe = false
  const text = msgForSubPayment(owner, sub, isFirstMessage, forMe)

  const contact = await models.Contact.findByPk(sub.contactId)
  const enc = rsa.encrypt(contact.contactKey, text)

  network.sendMessage({
    chat: chat,
    sender: owner,
    type: constants.message_types.direct_payment,
    message: { amount: sub.amount, content: enc },
    amount: sub.amount,
    success: async (data) => {
      const shouldEnd = checkSubscriptionShouldEndAfterThisPayment(subscription)
      const obj = {
        totalPaid: parseFloat(subscription.totalPaid||0) + parseFloat(subscription.amount),
        count: parseInt(subscription.count||0) + 1,
        ended: false,
      }
      if(shouldEnd) {
        obj.ended = true
        if(jobs[sub.id]) jobs[subscription.id].stop()
        delete jobs[subscription.id]
      }
      await subscription.update(obj)

      const forMe = true
      const text2 = msgForSubPayment(owner, sub, isFirstMessage, forMe)
      const encText = rsa.encrypt(owner.contactKey, text2)
      const message = await models.Message.create({
        chatId: chat.id,
        sender: owner.id,
        type: constants.message_types.direct_payment,
        status: constants.statuses.confirmed,
        messageContent: encText,
        amount: subscription.amount,
        amountMsat: parseFloat(subscription.amount) * 1000,
        date: date,
        createdAt: date,
        updatedAt: date,
        subscriptionId: subscription.id,
      })
      socket.sendJson({
        type: 'direct_payment',
        response: jsonUtils.messageToJson(message, chat)
      })
    },
    failure: async (err) => {
      console.log("SEND PAY ERROR")
      let errMessage = constants.payment_errors[err] || 'Unknown'
      errMessage = 'Payment Failed: ' + errMessage
      const message = await models.Message.create({
        chatId: chat.id,
        sender: owner.id,
        type: constants.message_types.direct_payment,
        status: constants.statuses.failed,
        messageContent: errMessage,
        amount: sub.amount,
        amountMsat: parseFloat(sub.amount) * 1000,
        date: date,
        createdAt: date,
        updatedAt: date,
        subscriptionId: sub.id,
      })
      socket.sendJson({
        type: 'direct_payment',
        response: jsonUtils.messageToJson(message, chat)
      })
    }
  })
}

// pause sub
async function pauseSubscription(req, res) {
  const id = parseInt(req.params.id)
  try {
    const sub = await models.Subscription.findOne({ where: { id } })
    if (sub) {
      sub.update({ paused: true })
      if (jobs[id]) jobs[id].stop()
      success(res, jsonUtils.subscriptionToJson(sub,null))
    } else {
      failure(res, 'not found')
    }
  } catch (e) {
    console.log('ERROR pauseSubscription', e)
    failure(res, e)
  }
};

// restart sub
async function restartSubscription(req, res) {
  const id = parseInt(req.params.id)
  try {
    const sub = await models.Subscription.findOne({ where: { id } })
    if (sub) {
      sub.update({ paused: false })
      if (jobs[id]) jobs[id].start()
      success(res, jsonUtils.subscriptionToJson(sub,null))
    } else {
      failure(res, 'not found')
    }
  } catch (e) {
    console.log('ERROR restartSubscription', e)
    failure(res, e)
  }
};

async function getRawSubs(opts = {}) {
  const options: {[k: string]: any} = { order: [['id', 'asc']], ...opts }
  try {
    const subs = await models.Subscription.findAll(options)
    return subs
  } catch (e) {
    throw e
  }
}

// all subs
const getAllSubscriptions = async (req, res) => {
  try {
    const subs = await getRawSubs()
    success(res, subs.map(sub => jsonUtils.subscriptionToJson(sub,null)))
  } catch (e) {
    console.log('ERROR getAllSubscriptions', e)
    failure(res, e)
  }
};

// one sub by id
async function getSubscription(req, res) {
  try {
    const sub = await models.Subscription.findOne({ where: { id: req.params.id } })
    success(res, jsonUtils.subscriptionToJson(sub,null))
  } catch (e) {
    console.log('ERROR getSubscription', e)
    failure(res, e)
  }
};

// delete sub by id
async function deleteSubscription(req, res) {
  const id = req.params.id
  if (!id) return
  try {
    if (jobs[id]) {
      jobs[id].stop()
      delete jobs[id]
    }
    models.Subscription.destroy({ where: { id } })
    success(res, true)
  } catch (e) {
    console.log('ERROR deleteSubscription', e)
    failure(res, e)
  }
};

// all subs for contact id
const getSubscriptionsForContact = async (req, res) => {
  try {
    const subs = await getRawSubs({ where: { contactId: req.params.contactId } })
    success(res, subs.map(sub => jsonUtils.subscriptionToJson(sub,null)))
  } catch (e) {
    console.log('ERROR getSubscriptionsForContact', e)
    failure(res, e)
  }
};

// create new sub
async function createSubscription(req, res) {
  const date = new Date()
  date.setMilliseconds(0)
  const s = jsonToSubscription({
    ...req.body,
    count: 0,
    total_paid: 0,
    createdAt: date,
    ended: false,
    paused: false
  })
  if(!s.cron){
    return failure(res, 'Invalid interval')
  }
  try {
    const owner = await models.Contact.findOne({ where: { isOwner: true } })
    const chat = await helpers.findOrCreateChat({
      chat_id: req.body.chat_id,
      owner_id: owner.id,
      recipient_id: req.body.contact_id,
    })
    s.chatId = chat.id // add chat id if newly created
    if(!owner || !chat){
      return failure(res, 'Invalid chat or contact')
    }
    const sub = await models.Subscription.create(s)
    startCronJob(sub)
    const isFirstMessage = true
    sendSubscriptionPayment(sub, isFirstMessage)
    success(res, jsonUtils.subscriptionToJson(sub, chat))
  } catch (e) {
    console.log('ERROR createSubscription', e)
    failure(res, e)
  }
};

async function editSubscription(req, res) {
  console.log('======> editSubscription')
  const date = new Date()
  date.setMilliseconds(0)
  const id = parseInt(req.params.id)
  const s = jsonToSubscription({
    ...req.body,
    count: 0,
    createdAt: date,
    ended: false,
    paused: false
  })
  try {
    if(!id || !s.chatId || !s.cron){
      return failure(res, 'Invalid data')
    }
    const subRecord = await models.Subscription.findOne({ where: { id }})
    if(!subRecord) {
      return failure(res, 'No subscription found')
    }
    // stop so it can be restarted
    if (jobs[id]) jobs[id].stop()
    const obj: {[k: string]: any} = {
      cron: s.cron,
      updatedAt: date,
    }
    if(s.amount) obj.amount = s.amount
    if(s.endDate) obj.endDate = s.endDate
    if(s.endNumber) obj.endNumber = s.endNumber

    const sub = await subRecord.update(obj)
    const end = checkSubscriptionShouldAlreadyHaveEnded(sub)
    if(end) {
      await subRecord.update({ended:true})
      delete jobs[id]
    } else {
      startCronJob(sub) // restart
    }
    const chat = await models.Chat.findOne({ where: { id: s.chatId }})
    success(res, jsonUtils.subscriptionToJson(sub, chat))
  } catch (e) {
    console.log('ERROR createSubscription', e)
    failure(res, e)
  }
};

function jsonToSubscription(j) {
  console.log("=>",j)
  const cron = cronUtils.make(j.interval)
  return toCamel({
    ...j,
    cron,
  })
}

export {
  initializeCronJobs,
  getAllSubscriptions,
  getSubscription,
  createSubscription,
  getSubscriptionsForContact,
  pauseSubscription,
  restartSubscription,
  deleteSubscription,
  editSubscription,
}
