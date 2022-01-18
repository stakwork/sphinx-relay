import * as crypto from 'crypto'
import { models } from './models'
import * as cryptoJS from 'crypto-js'
import { success, failure } from './utils/res'
import { setInMemoryMacaroon } from './utils/macaroon'
import { loadConfig } from './utils/config'
import { isProxy } from './utils/proxy'
import * as jwtUtils from './utils/jwt'
import { allowedJwtRoutes } from './scopes'
import * as rsa from './crypto/rsa'

const fs = require('fs')

const config = loadConfig()

/*
"unlock": true,
"encrypted_macaroon_path": "/relay/.lnd/admin.macaroon.enc"
*/

export async function unlocker(req, res): Promise<boolean> {
  const { password } = req.body
  if (!password) {
    failure(res, 'no password')
    return false
  }

  const encMacPath = config.encrypted_macaroon_path
  if (!encMacPath) {
    failure(res, 'no macaroon path')
    return false
  }

  let hexMac: string

  try {
    const encMac = fs.readFileSync(config.encrypted_macaroon_path, 'utf8')
    if (!encMac) {
      failure(res, 'no macaroon')
      return false
    }

    const decMac = decryptMacaroon(password, encMac)
    if (!decMac) {
      failure(res, 'failed to decrypt macaroon')
      return false
    }

    const isBase64 = b64regex.test(decMac)
    if (!isBase64) {
      failure(res, 'failed to decode macaroon')
      return false
    }

    hexMac = base64ToHex(decMac)
  } catch (e) {
    failure(res, e)
    return false
  }

  if (hexMac) {
    setInMemoryMacaroon(hexMac)
    success(res, 'success!')
    await sleep(100)
    return true
  } else {
    failure(res, 'failed to set macaroon in memory')
    return false
  }
}

export async function ownerMiddleware(req, res, next) {
  if (
    req.path == '/app' ||
    req.path == '/is_setup' ||
    req.path == '/' ||
    req.path == '/unlock' ||
    req.path == '/info' ||
    req.path == '/action' ||
    req.path == '/contacts/tokens' ||
    req.path == '/latest' ||
    req.path.startsWith('/static') ||
    req.path == '/contacts/set_dev' ||
    req.path == '/connect' ||
    req.path == '/connect_peer' ||
    req.path == '/peered'
  ) {
    next()
    return
  }

  // Here we are grabing both the x-user-token and x-transport-token
  const x_user_token =
    req.headers['x-user-token'] || req.cookies['x-user-token']
  const x_transport_token =
    req.headers['x-transport-token'] || req.cookies['x-transport-token']

  console.log('Transport toke:', x_transport_token)

  // default assign token to x-user-token
  let token = x_user_token

  // Read the transport private key since we will need to decrypt with this
  const transportPrivateKey = fs.readFileSync('transportPrivate.pem')

  // If we see the user using the new x_transport_token
  // we will enter this if block and execute this logic
  if (x_transport_token) {
    // Decrypt the token and split by space not sure what
    // the correct way to do the delimiting so I just put
    // a space for now
    const splitTransportToken = rsa
      .decrypt(transportPrivateKey, x_transport_token)
      .split(' ')

    // The token will be the first item
    token = splitTransportToken[0]

    // The second item will be the timestamp
    const splitTransportTokenTimestamp = splitTransportToken[1]

    console.log(
      new Date(splitTransportTokenTimestamp) < new Date(Date.now() + 1 * 60000)
    )
    console.log(new Date(splitTransportTokenTimestamp))
    console.log(new Date(Date.now() + 1 * 60000))

    // Check if the timestamp is within the timeframe we
    // chose to clear out the db of saved recent requests
    if (
      new Date(splitTransportTokenTimestamp) < new Date(Date.now() + 1 * 60000)
    ) {
      res.writeHead(401, 'Access invalid for user', {
        'Content-Type': 'text/plain',
      })
      res.end('invalid credentials')
      return console.error('Too old of a request')
    }

    // TODO: we need to add a way to save the request and also
    // to check the old requests to see if they use the same x_transport_token
  }

  console.log('Transport token decrypted:', token)

  if (process.env.HOSTING_PROVIDER === 'true') {
    if (token) {
      // add owner in anyway
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('base64')
      const owner = await models.Contact.findOne({
        where: { authToken: hashedToken, isOwner: true },
      })
      if (owner) {
        req.owner = owner.dataValues
      }
    } else if (!isProxy()) {
      const owner2 = await models.Contact.findOne({
        where: { isOwner: true },
      })
      if (owner2) req.owner = owner2.dataValues
    }
    if (req.path === '/invoices') {
      next()
      return
    }
  }

  const jwt = req.headers['x-jwt'] || req.cookies['x-jwt']

  if (!token && !jwt) {
    res.writeHead(401, 'Access invalid for user', {
      'Content-Type': 'text/plain',
    })
    res.end('Invalid credentials')
    return
  }

  let owner

  // find by auth token
  if (token) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('base64')
    owner = await models.Contact.findOne({
      where: { authToken: hashedToken, isOwner: true },
    })
  }

  // find by JWT
  if (jwt) {
    const parsed = jwtUtils.verifyJWT(jwt)
    if (parsed) {
      const publicKey = (parsed.body as any).pubkey
      const allowed = allowedJwtRoutes(parsed.body, req.path)
      if (allowed && publicKey) {
        owner = await models.Contact.findOne({
          where: { publicKey, isOwner: true },
        })
      }
    }
  }

  if (!owner) {
    res.writeHead(401, 'Access invalid for user', {
      'Content-Type': 'text/plain',
    })
    res.end('Invalid credentials')
  } else {
    req.owner = owner.dataValues
    next()
  }
}

function decryptMacaroon(password: string, macaroon: string) {
  try {
    const decrypted = cryptoJS.AES.decrypt(macaroon || '', password).toString(
      cryptoJS.enc.Base64
    )
    const decryptResult = atob(decrypted)
    return decryptResult
  } catch (e) {
    console.error('cipher mismatch, macaroon decryption failed')
    console.error(e)
    return ''
  }
}

export function base64ToHex(str) {
  const raw = atob(str)
  let result = ''
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16)
    result += hex.length === 2 ? hex : '0' + hex
  }
  return result.toUpperCase()
}

const atob = (a) => Buffer.from(a, 'base64').toString('binary')

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const b64regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/

/* deprecated */
export async function authModule(req, res, next) {
  if (
    req.path == '/app' ||
    req.path == '/' ||
    req.path == '/unlock' ||
    req.path == '/info' ||
    req.path == '/action' ||
    req.path == '/contacts/tokens' ||
    req.path == '/latest' ||
    req.path.startsWith('/static') ||
    req.path == '/contacts/set_dev' ||
    req.path == '/connect'
  ) {
    next()
    return
  }

  if (process.env.HOSTING_PROVIDER === 'true') {
    // const host = req.headers.origin
    // const referer = req.headers.referer
    if (req.path === '/invoices') {
      next()
      return
    }
  }

  //get transportToken private key from somewhere
  //const transportToken = crypto.publicEncrypt('some entropy')

  const token = req.headers['x-user-token'] || req.cookies['x-user-token']
  if (token == null) {
    res.writeHead(401, 'Access invalid for user', {
      'Content-Type': 'text/plain',
    })
    res.end('Invalid credentials')
  } else {
    const user = await models.Contact.findOne({ where: { isOwner: true } })
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('base64')
    if (user.authToken == null || user.authToken != hashedToken) {
      res.writeHead(401, 'Access invalid for user', {
        'Content-Type': 'text/plain',
      })
      res.end('Invalid credentials')
    } else {
      next()
    }
  }
}
