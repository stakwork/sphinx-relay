var fetch = require('node-fetch')
var minimist = require('minimist')
var RNCryptor = require('jscryptor-2')
var fs = require('fs')

const argv = minimist(process.argv.slice(2))
const keyz = argv.keys
const pin = argv.pin

async function go() {
  const keys = Buffer.from(keyz, 'base64').toString()

  const enc = keys.split('::')[1]

  const dec = RNCryptor.Decrypt(enc, pin + '').toString()

  const all = dec.split('::')

  const priv = all[0]
  const pub = all[1]
  const ip = all[2]
  const token = all[3]

  const r = await fetch(ip + '/contacts', {
    headers: {
      'x-user-token': token,
    },
  })
  const j = await r.json()
  const owner = j.response.contacts.find((c) => c.is_owner)

  console.log(
    JSON.stringify(
      {
        pubkey: owner.public_key,
        ip: ip,
        authToken: token,
        contact_key: pub,
        privkey: priv,
        routeHint: owner.route_hint || '',
      },
      null,
      2
    )
  )

  fs.writeFileSync(
    './stuff.json',
    JSON.stringify(
      {
        pubkey: owner.public_key,
        ip: ip,
        authToken: token,
        contact_key: pub,
        privkey: priv,
        routeHint: owner.route_hint || '',
      },
      null,
      2
    )
  )
}

go()
