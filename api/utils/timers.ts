import { models } from '../models'
import * as network from '../network'
import * as path from 'path'

const constants = require(path.join(__dirname,'../../config/constants.json'))

export async function addTimer({amount, millis, receiver}){
    const now = new Date().valueOf()
    const when = now + millis
    const t = await models.Timer.create({
        amount, millis:when, receiver,
    })
    setTimer(when, async ()=>{
        payBack(t)
    })
}
export function setTimer(when:number, cb){
	const now = new Date().valueOf()
	const ms = when-now
	if(ms<0) cb() // fire right away if its already passed
	else setTimeout(cb, ms)
}
export async function reloadTimers(){
	const timers = await models.Timer.findAll()
	timers && timers.forEach(t=>{
		setTimer(t.millis, async ()=>{
			payBack(t)
		})
	})
}
export async function payBack(t){
    console.log("PAY BACK")
    const chat = await models.Chat.findOne({ where: {id:t.chatId} })
    const owner = await models.Contact.findOne({ where: {isOwner:true} })
    if(!chat) return
    const theChat = {...chat.dataValues, contactIds:[t.receiver]}
    network.sendMessage({
        chat: theChat,
        sender: owner,
        message: {id:t.ref},
        amount: t.amount,
        type: constants.message_types.confirmation,
    })
    models.Timer.destroy({where:{id:t.id}})
}
