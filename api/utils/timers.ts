import { models } from '../models'
import * as network from '../network'

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
    const contact = await models.Contact.findOne({where:{id:t.receiver}})
    if(contact){
        network.signAndSend({
            amt: t.amount,
            dest: contact.publicKey,
        })
    }
    models.Timer.destroy({where:{id:t.id}})
}
