import {models} from '../models'
import * as crypto from 'crypto'
import * as socket from '../utils/socket'
import * as helpers from '../helpers'
import * as jsonUtils from '../utils/json'
import {success, failure} from '../utils/res'
import password from '../utils/password'
import * as path from 'path'

const constants = require(path.join(__dirname,'../../config/constants.json'))

const getContacts = async (req, res) => {
	const contacts = await models.Contact.findAll({ where:{deleted:false}, raw: true })
	const invites = await models.Invite.findAll({ raw: true })
	const chats = await models.Chat.findAll({ where:{deleted:false}, raw: true })
	const subscriptions = await models.Subscription.findAll({ raw: true })

	const contactsResponse = contacts.map(contact => {
		let contactJson = jsonUtils.contactToJson(contact)
		let invite = invites.find(invite => invite.contactId == contact.id)

		if (invite) {
			contactJson.invite = jsonUtils.inviteToJson(invite)
		}
		
		return contactJson
	});

	const subsResponse = subscriptions.map(s=> jsonUtils.subscriptionToJson(s,null))
  	const chatsResponse = chats.map(chat => jsonUtils.chatToJson(chat))

	success(res, {
		contacts: contactsResponse,
		chats: chatsResponse,
		subscriptions: subsResponse
	})
}

const generateToken = async (req, res) => {
	console.log('=> generateToken called', { body: req.body, params: req.params, query: req.query })

	const owner = await models.Contact.findOne({ where: { isOwner: true, authToken: null }})

	const pwd = password
	if(process.env.USE_PASSWORD==='true'){
		if(pwd!==req.query.pwd) {
			failure(res, 'Wrong Password')
			return
		} else {
			console.log("PASSWORD ACCEPTED!")
		}
	}

	if (owner) {
		const hash = crypto.createHash('sha256').update(req.body['token']).digest('base64');

		console.log("req.params['token']", req.params['token']);
		console.log("hash", hash);

		owner.update({ authToken: hash })

		success(res,{})
	} else {
		failure(res,{})
	}
}

const updateContact = async (req, res) => {
	console.log('=> updateContact called', { body: req.body, params: req.params, query: req.query })

	let attrs = extractAttrs(req.body)

	const contact = await models.Contact.findOne({ where: { id: req.params.id }})
	let shouldUpdateContactKey = (contact.isOwner && contact.contactKey == null && attrs["contact_key"] != null)

	const owner = await contact.update(jsonUtils.jsonToContact(attrs))
	success(res, jsonUtils.contactToJson(owner))

	if (!shouldUpdateContactKey) return

	const contactIds = await models.Contact.findAll({where:{deleted:false}}).map(c => c.id)
	if (contactIds.length == 0) return

	helpers.sendContactKeys({
		contactIds: contactIds,
		sender: owner,
		type: constants.message_types.contact_key,
	})
}

const exchangeKeys = async (req, res) => {
	console.log('=> exchangeKeys called', { body: req.body, params: req.params, query: req.query })

	const contact = await models.Contact.findOne({ where: { id: req.params.id }})
	const owner = await models.Contact.findOne({ where: { isOwner: true }})

	success(res, jsonUtils.contactToJson(contact))

	helpers.sendContactKeys({
		contactIds: [contact.id],
		sender: owner,
		type: constants.message_types.contact_key,
	})
}

const createContact = async (req, res) => {
	console.log('=> createContact called', { body: req.body, params: req.params, query: req.query })

	let attrs = extractAttrs(req.body)

	const owner = await models.Contact.findOne({ where: { isOwner: true }})

	const existing = attrs['public_key'] && await models.Contact.findOne({where:{publicKey:attrs['public_key']}})
	console.log("EXISTING?",existing?true:false)
	if(existing) {
		const updateObj:{[k:string]:any} = {fromGroup:false}
		if(attrs['alias']) updateObj.alias = attrs['alias']
		await existing.update(updateObj)
		console.log("UDPATE!",existing.dataValues)
		return success(res, jsonUtils.contactToJson(existing))
	}

	const createdContact = await models.Contact.create(attrs)
	const contact = await createdContact.update(jsonUtils.jsonToContact(attrs))

	success(res, jsonUtils.contactToJson(contact))

	helpers.sendContactKeys({
		contactIds: [contact.id],
		sender: owner,
		type: constants.message_types.contact_key,
	})
}

const deleteContact = async (req, res) => {
	const id = parseInt(req.params.id||'0')
	if(!id || id===1) {
		failure(res, 'Cannot delete self')
		return
	}

	const contact = await models.Contact.findOne({ where: { id } })
	if(!contact) return

	const owner = await models.Contact.findOne({ where: { isOwner: true }})
	const tribesImAdminOf = await models.Chat.findAll({where:{ownerPubkey:owner.publicKey}})
	const tribesIdArray = tribesImAdminOf && tribesImAdminOf.length && tribesImAdminOf.map(t=>t.id)
	let okToDelete = true
	if(tribesIdArray && tribesIdArray.length) {
		const thisContactMembers = await models.ChatMember.findAll({where:{id:{in:tribesIdArray}}})
		if(thisContactMembers&&thisContactMembers.length){
			// IS A MEMBER! dont delete, instead just set from_group=true
			okToDelete=false
			console.log("SET CONTACT FROM.GROUP=true")
			await contact.update({fromGroup:true})
		}
	}

	if(okToDelete){
		console.log("ACTULLAY DELTE CONTACT")
		await contact.update({
			deleted:true,
			publicKey:'',
			photoUrl:'',
			alias:'Unknown',
			contactKey:'',
		})
	}

	// find and destroy chat & messages
	const chats = await models.Chat.findAll({where:{deleted:false}})
	chats.map(async chat => {
		if (chat.type === constants.chat_types.conversation) {
			const contactIds = JSON.parse(chat.contactIds)
			if (contactIds.includes(id)) {
				await chat.update({
					deleted: true, 
					uuid:'', 
					contactIds:'[]',
					name:''
				})
				await models.Message.destroy({ where: { chatId: chat.id } })
			}
		}
	})
	await models.Invite.destroy({ where: { contactId: id } })
	await models.Subscription.destroy({ where: { contactId: id } })

	success(res, {})
}

const receiveConfirmContactKey = async (payload) => {
	console.log(`=> confirm contact key for ${payload.sender&&payload.sender.pub_key}`)

	const dat = payload.content || payload
	const sender_pub_key = dat.sender.pub_key
	const sender_contact_key = dat.sender.contact_key
	const sender_alias = dat.sender.alias || 'Unknown'
	const sender_photo_url = dat.sender.photoUrl

	if(sender_photo_url){
		// download and store photo locally
	}

	const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key, status: constants.contact_statuses.confirmed }})
	if (sender_contact_key && sender) {
		if(!sender.alias || sender.alias==='Unknown') {
			sender.update({ contactKey: sender_contact_key, alias: sender_alias })
		} else {
			sender.update({ contactKey: sender_contact_key })
		}		

		socket.sendJson({
			type: 'contact',
			response: jsonUtils.contactToJson(sender)
		})
	}
}

const receiveContactKey = async (payload) => {
	console.log('=> received contact key', JSON.stringify(payload))

	const dat = payload.content || payload
	const sender_pub_key = dat.sender.pub_key
	const sender_contact_key = dat.sender.contact_key
	const sender_alias = dat.sender.alias || 'Unknown'
	const sender_photo_url = dat.sender.photoUrl

	if(sender_photo_url){
		// download and store photo locally
	}

	const owner = await models.Contact.findOne({ where: { isOwner: true }})
	const sender = await models.Contact.findOne({ where: { publicKey: sender_pub_key, status: constants.contact_statuses.confirmed }})

	if (sender_contact_key && sender) {
		if(!sender.alias || sender.alias==='Unknown') {
			sender.update({ contactKey: sender_contact_key, alias: sender_alias })
		} else {
			sender.update({ contactKey: sender_contact_key })
		}

		socket.sendJson({
			type: 'contact',
			response: jsonUtils.contactToJson(sender)
		})
	}

	helpers.sendContactKeys({
		contactPubKey: sender_pub_key,
		sender: owner,
		type: constants.message_types.contact_key_confirmation,
	})
}

const extractAttrs = body => {
	let fields_to_update = ["public_key", "node_alias", "alias", "photo_url", "device_id", "status", "contact_key", "from_group"]
	let attrs = {}
	Object.keys(body).forEach(key => {
		if (fields_to_update.includes(key)) {
			attrs[key] = body[key]
		}
	})
	return attrs
}

export {
	generateToken,
	exchangeKeys,
	getContacts,
	updateContact,
	createContact,
	deleteContact,
	receiveContactKey,
	receiveConfirmContactKey
}
