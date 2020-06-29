import { models } from '../models'
import * as network from '../network'
import * as path from 'path'

const constants = require(path.join(__dirname,'../../config/constants.json'))

const timerz={}
function clearTimer(t){
    const name = makeName(t)
    if(name) clearTimeout(timerz[name])
}
export async function removeTimerByMsgId(msgId){
    const t = await models.Timer.findOne({where:{msgId}})
    clearTimer(t)
    models.Timer.destroy({where:{msgId}})
}
export async function removeTimersByContactId(contactId){
    const ts = await models.Timer.findAll({where:{receiver:contactId}})
    ts.forEach(t=> clearTimer(t))
    models.Timer.destroy({where:{receiver:contactId}})
}

export async function addTimer({amount, millis, receiver, msgId, chatId}){
    const now = new Date().valueOf()
    const when = now + millis
    const t = await models.Timer.create({
        amount, millis:when, receiver, msgId, chatId,
    })
    setTimer(makeName(t), when, async ()=>{
        payBack(t)
    })
}
export function setTimer(name:string, when:number, cb){
	const now = new Date().valueOf()
	const ms = when-now
	if(ms<0) {
        cb() // fire right away if its already passed
    } else {
        timerz[name] = setTimeout(cb, ms)
    }
}
function makeName(t){
    if(!t) return ''
    return `${t.chatId}_${t.receiver}_${t.msgId}`
}

export async function reloadTimers(){
    console.log("reload timers")
    const timers = await models.Timer.findAll()
    console.log('timers.length',timers.length)
	timers && timers.forEach((t,i)=>{
        const name = makeName(t)
		setTimer(name, t.millis, async ()=>{
            setTimeout(()=>{
                payBack(t)
            },i*250) // dont do all at once
		})
	})
}
export async function payBack(t){
    console.log('pay back')
    const chat = await models.Chat.findOne({ where: {id:t.chatId} })
    const owner = await models.Contact.findOne({ where: {isOwner:true} })
    console.log('is a chat?',chat.id)
    if(!chat) return
    const theChat = {...chat.dataValues, contactIds:[t.receiver]}
    console.log('send msg',{id:t.msgId})
    network.sendMessage({
        chat: theChat,
        sender: owner,
        message: {id:t.msgId,amount:t.amount,},
        amount: t.amount,
        type: constants.message_types.repayment,
    })
    models.Timer.destroy({where:{id:t.id}})
}
