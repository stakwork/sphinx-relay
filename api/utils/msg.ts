
import { tokenFromTerms } from './ldat'

function addInRemoteText(full:{[k:string]:any}, contactId){
	const m = full && full.message
	if (!(m && m.content)) return full
	if (!(typeof m.content==='object')) return full
	return fillmsg(full, {content: m.content[contactId+'']})
}

function removeRecipientFromChatMembers(full:{[k:string]:any}, destkey){
	const c = full && full.chat
	if (!(c && c.members)) return full
	if (!(typeof c.members==='object')) return full

    const members = {...c.members}
	if(members[destkey]) delete members[destkey]
	return fillchatmsg(full, {members})
}

function removeAllNonAdminMembersIfTribe(full:{[k:string]:any}, destkey){
	return full
	// const c = full && full.chat
	// if (!(c && c.members)) return full
	// if (!(typeof c.members==='object')) return full

    // const members = {...c.members}
	// if(members[destkey]) delete members[destkey]
	// return fillchatmsg(full, {members})
}

function addInMediaKey(full:{[k:string]:any}, contactId){
	const m = full && full.message
	if (!(m && m.mediaKey)) return full
	if (!(m && m.mediaTerms)) return full
	if (!(typeof m.mediaKey==='object')) return full
	
	const mediaKey = m.mediaTerms.skipSigning ? '' : m.mediaKey[contactId+'']
	return fillmsg(full, {mediaKey})
}

// add the token if its free, but if a price just the base64(host).muid
async function finishTermsAndReceipt(full:{[k:string]:any}, destkey) {
	const m = full && full.message
	if (!(m && m.mediaTerms)) return full

	const t = m.mediaTerms
	const meta = t.meta || {}
	t.ttl = t.ttl || 31536000
	meta.ttl = t.ttl
	const mediaToken = await tokenFromTerms({
		host: t.host || '',
		muid: t.muid,
		ttl: t.skipSigning ? 0 : t.ttl,
		pubkey: t.skipSigning ? '' : destkey,
		meta
	})
	const fullmsg = fillmsg(full, {mediaToken})
	delete fullmsg.message.mediaTerms
	return fullmsg
}

async function personalizeMessage(m,contactId,destkey){
	const cloned = JSON.parse(JSON.stringify(m))
	const msg = addInRemoteText(cloned, contactId)
	const cleanMsg = removeRecipientFromChatMembers(msg, destkey)
	const cleanerMsg = removeAllNonAdminMembersIfTribe(msg, destkey)
	const msgWithMediaKey = addInMediaKey(cleanerMsg, contactId)
	const finalMsg = await finishTermsAndReceipt(msgWithMediaKey, destkey)
    return finalMsg
}

function fillmsg(full, props){
	return {
		...full, message: {
			...full.message,
			...props,
		}
	}
}

function fillchatmsg(full, props){
	return {
		...full, chat: {
			...full.chat,
			...props,
		}
	}
}

export {
    personalizeMessage
}