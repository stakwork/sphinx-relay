import { models } from '../models'
import * as crypto from 'crypto'
import * as jsonUtils from '../utils/json'
import { finishInviteInHub, createInviteInHub, payInviteInvoice } from '../hub'

export const finishInvite = async (req, res) => {
	const {
		invite_string
	} = req.body
	const params = {
		invite: {
			pin: invite_string
		}
	}

	function onSuccess() {
		res.status(200)
		res.json({ success: true })
		res.end()
	}
	function onFailure() {
		res.status(200)
		res.json({ success: false })
		res.end()
	}

	finishInviteInHub(params, onSuccess, onFailure)
}

export const payInvite = async (req, res) => {

	const invite_string = req.params['invite_string']
	const dbInvite = await models.Invite.findOne({ where: { inviteString: invite_string } })

	const onSuccess = async (response) => {
		// const invite = response.object
		// console.log("response", invite)
		// if (dbInvite.status != invite.invite_status) {
		// 	dbInvite.update({ status: invite.invite_status })
		// }
		if (response.payment_error) {
			console.log("=> payInvite ERROR", response.payment_error)
			res.status(200)
			res.json({ success: false, error: response.payment_error })
			res.end()
		} else {
			res.status(200)
			res.json({ success: true, response: { invite: jsonUtils.inviteToJson(dbInvite) } })
			res.end()
		}
	}

	const onFailure = (response) => {
		console.log("=> payInvite ERROR", response)
		res.status(200)
		res.json({ success: false })
		res.end()
	}

	// payInviteInHub(invite_string, params, onSuccess, onFailure)
	payInviteInvoice(dbInvite.invoice, onSuccess, onFailure)
}

export const createInvite = async (req, res) => {
	const {
		nickname,
		welcome_message
	} = req.body

	const owner = await models.Contact.findOne({ where: { isOwner: true } })

	const params = {
		invite: {
			nickname: owner.alias,
			pubkey: owner.publicKey,
			contact_nickname: nickname,
			message: welcome_message,
			pin: crypto.randomBytes(20).toString('hex')
		}
	}

	const onSuccess = async (response) => {
		console.log("response", response)

		const inviteCreated = response.object

		const contact = await models.Contact.create({
			alias: nickname,
			status: 0
		})
		const invite = await models.Invite.create({
			welcomeMessage: inviteCreated.message,
			contactId: contact.id,
			status: inviteCreated.invite_status,
			inviteString: inviteCreated.pin,
			// invoice: inviteCreated.invoice,
		})
		let contactJson = jsonUtils.contactToJson(contact)
		if (invite) {
			contactJson.invite = jsonUtils.inviteToJson(invite)
		}

		res.status(200)
		res.json({ success: true, contact: contactJson })
		res.end()
	}

	const onFailure = (response) => {
		res.status(200)
		res.json(response)
		res.end()
	}

	createInviteInHub(params, onSuccess, onFailure)
}

