var fetch = require('node-fetch')
var crypto = require('crypto')
var minimist = require('minimist')
var rsa = require('./rsa')

const argv = minimist(process.argv.slice(2));
const pubkey = argv.pubkey
const port = argv.port || '3004' // proxy by default

const relayURL = 'http://localhost:'+port+'/'

/*
node ./signup --pubkey=XXX --port=3004
*/

async function signup(pubkey){
  console.log("SIGNUP AS", pubkey)
  const token = crypto.randomBytes(20).toString('hex').toUpperCase()
  const body = {
    token: token,
    pubkey: pubkey,
  }
  const r = await fetch(relayURL+'contacts/tokens', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  })
  const j = await r.json()
  console.log('j',j)
  const ownerID = j.response.id
  if(!ownerID) return console.log("FAIL")

  const keys = await rsa.genKeys()
  const contact_key = keys.public
  console.log("PROXY NODE:", {
    pubkey, 
    authToken: token, 
    contact_key,
    privkey: keys.private,
  })

  const r3 = await fetch(relayURL+'contacts/'+ownerID, {
    method: 'PUT',
    body: JSON.stringify({contact_key}),
    headers: {'Content-Type': 'application/json', 'x-user-token':token}
  })
  const j3 = await r3.json()
  console.log(j3)
}

if(pubkey) {
  signup(pubkey)
}