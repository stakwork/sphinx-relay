import * as http from 'ava-http'
import { config } from '../../config'

async function getToken(t, node) {
	//A NODE GETS A SERVER TOKEN FOR POSTING TO MEME SERVER

	const protocol = memeProtocol(config.memeHost)
	//get authentication challenge from meme server
	const r = await http.get(`${protocol}://${config.memeHost}/ask`)
	t.truthy(r, 'r should exist')
	t.truthy(r.challenge, 'r.challenge should exist')

	//call relay server with challenge
	const r2 = await http.get(
		node.external_ip + `/signer/${r.challenge}`,
		makeArgs(node)
	)
	t.true(r2.success, 'r2 should exist')
	t.truthy(r2.response.sig, 'r2.sig should exist')

	//get server token
	const r3 = await http.post(`${protocol}://${config.memeHost}/verify`, {
		form: { id: r.id, sig: r2.response.sig, pubkey: node.pubkey },
	})
	t.truthy(r3, 'r3 should exist')
	t.truthy(r3.token, 'r3.token should exist')

	return r3.token
}

function memeProtocol(host) {
	let p = 'https'
	if (host.includes('localhost')) p = 'http'
	return p
}

function makeArgs(node, body = {}) {
	return {
		headers: { 'x-user-token': node.authToken },
		body,
	}
}

export { getToken, makeArgs, memeProtocol }
