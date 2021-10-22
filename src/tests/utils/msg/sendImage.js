import fetch from 'node-fetch'
import * as http from 'ava-http'
import * as RNCryptor from 'jscryptor-2'
import { uploadMeme } from '../../electronjs/meme'
import { encrypt, decrypt } from '../../electronjs/rsa'
import { getSelf } from '../get/getSelf'
import { getChats } from '../get/getChats'
import { getContacts } from '../get/getContacts'
import { getCheckNewMsgs } from '../get/getCheckNewMessages'
import { getCheckNewPaidMsgs } from '../get/getCheckNewPaidMsgs'
import { arraysEqual, getToken, makeArgs, memeProtocol } from '../helpers'
import { config } from '../../config'

export async function sendImage(t, node1, node2, image, tribe, price) {
	//NODE1 SENDS AN IMAGE TO NODE2

	var token = await getToken(t, node1)
	var host = config.memeHost
	var fileBase64 = 'data:image/jpg;base64,' + image
	var typ = 'image/jpg'
	var filename = 'Image.jpg'
	var isPublic = false

	const upload = await uploadMeme(
		fileBase64,
		typ,
		host,
		token,
		filename,
		isPublic
	)
	t.true(typeof upload === 'object', 'meme should have been uploaded')
	t.true(typeof upload.media_key === 'string', 'upload should have media key')
	t.true(typeof upload.muid === 'string', 'upload should have muid')

	var n1contactP1 = {}
	var n2contactP1 = {}
	if (tribe) {
		n1contactP1 = await getSelf(t, node1)
	} else {
		;[n1contactP1, n2contactP1] = await getContacts(t, node1, node2)
	}

	//encrypt media_key with node1 contact_key, node1 perspective
	let encrypted_media_key = encrypt(n1contactP1.contact_key, upload.media_key)
	let encrypted_media_key2
	let contactIdP1 = null
	let tribeIdP1 = null
	let mediaKeyMap = null
	if (tribe) {
		//encrypt media_key with tribe group_key
		encrypted_media_key2 = encrypt(tribe.group_key, upload.media_key)
		tribeIdP1 = await getTribeId(t, node1, tribe)
		mediaKeyMap = {
			['chat']: encrypted_media_key2,
			[n1contactP1.id]: encrypted_media_key,
		}
	} else {
		//encrypt media_key with node2 contact_key, node1 perspective
		encrypted_media_key2 = encrypt(n2contactP1.contact_key, upload.media_key)
		contactIdP1 = n2contactP1.id
		mediaKeyMap = {
			[n2contactP1.id]: encrypted_media_key2,
			[n1contactP1.id]: encrypted_media_key,
		}
	}

	//media key map is
	//person_sending_to: person_sending_to_contact_key,
	//person_sending: person_sending_contact_key

	//create
	let i = {
		contact_id: contactIdP1,
		chat_id: tribeIdP1,
		muid: upload.muid,
		media_key_map: mediaKeyMap,
		media_type: 'image/jpg',
		text: '',
		amount: 0,
		price: 0 || price,
	}

	//send message from node1 to node2
	const img = await http.post(
		node1.external_ip + '/attachment',
		makeArgs(node1, i)
	)
	//make sure msg exists
	t.true(img.success, 'sent image should exist')
	const imgMsg = img.response
	var imgUuid = imgMsg.uuid
	var url = ''
	var node2MediaKey = ''
	var decryptMediaKey = ''

	if (price) {
		//IF IMAGE HAS A PRICE ===>
		const lastPrePurchMsg = await getCheckNewMsgs(t, node2, imgUuid)

		//create contact_id for purchase message
		var n2contactP2 = {}
		var n1contactP2 = {}
		if (tribe) {
			;[n2contactP2, n1contactP2] = await getContacts(t, node2, node1)
		} else {
			;[n2contactP2, n1contactP2] = await getContacts(t, node2, node1)
		}
		let purchContact = n1contactP2.id
		//create chat_id for purchase message (in tribe and outside tribe)
		let purchChat = null
		if (tribe) {
			purchChat = await getTribeId(t, node2, tribe)
		} else {
			const chats = await getChats(t, node2)
			const selfie = await getSelf(t, node2)
			const selfId = selfie.id
			const sharedChat = chats.find((chat) =>
				arraysEqual(chat.contact_ids, [selfId, parseInt(n1contactP2.id)])
			)
			t.truthy(sharedChat, 'there should be a chat with node1 and node2')
			purchChat = sharedChat.id
		}
		//create media_token for purchase message
		const mediaToken = lastPrePurchMsg.media_token

		//create purchase message object
		let p = {
			contact_id: purchContact,
			chat_id: purchChat,
			amount: price,
			media_token: mediaToken,
		}

		//send purchase message from node2 purchasing node1 image
		const purchased = await http.post(
			node2.external_ip + '/purchase',
			makeArgs(node2, p)
		)
		t.true(
			purchased.success,
			'purchase message should be posted ' + purchased.error
		)
		//get payment accepted message
		var paymentMsg = await getCheckNewPaidMsgs(t, node2, imgMsg)

		//get media key from payment accepted message
		//(Last message by token.media_key, type 8, purchase message)
		node2MediaKey = paymentMsg.media_key
		t.true(typeof node2MediaKey === 'string', 'node2MediaKey should exist')
		//create url with media_token
		const protocol = memeProtocol(config.memeHost)
		url = `${protocol}://${config.memeHost}/file/${paymentMsg.media_token}`
	} else {
		//RECEIVE UNPAID IMAGE ===>

		//Check that image message was received
		const lastMessage2 = await getCheckNewMsgs(t, node2, imgUuid)
		//get media_key from received image message
		node2MediaKey = lastMessage2.media_key
		t.true(typeof node2MediaKey === 'string', 'node2MediaKey should exist')
		//create url with media_token
		const protocol = memeProtocol(config.memeHost)
		url = `${protocol}://${config.memeHost}/file/${lastMessage2.media_token}`
	}

	//DECRYPT IMAGE
	decryptMediaKey = decrypt(node2.privkey, node2MediaKey)
	t.true(typeof decryptMediaKey === 'string', 'decryptMediaKey should exist')
	var token = await getToken(t, node2)
	t.true(typeof token === 'string', 'should get media token')
	const res2 = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
		method: 'GET',
	})
	t.true(typeof res2 === 'object', 'res2 should exist')
	const blob = await res2.buffer()
	t.true(blob.length > 0, 'blob should exist')
	//media_key needs to be decrypted with your private key
	const dec = RNCryptor.Decrypt(blob.toString('base64'), decryptMediaKey)
	// const b64 = dec.toString('base64')
	// //check equality b64 to b64
	t.true(dec.toString('base64') === image)

	return true
}
