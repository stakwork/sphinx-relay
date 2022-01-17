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

  const x_user_token =
    req.headers['x-user-token'] || req.cookies['x-user-token']
  const x_transport_token =
    req.headers['x-transport-token'] || req.cookies['x-transport-token']

  console.log('Transport toke:', x_transport_token)
  let token = x_user_token
  const transportPrivateKey = fs.readFileSync('transportPrivate.pem')
  if (x_transport_token) {
    const splitTransportToken = rsa
      .decrypt(transportPrivateKey, x_transport_token)
      .split(' ')
    token = splitTransportToken[0]
    const splitTransportTokenTimestamp = splitTransportToken[1]
    if (new Date(splitTransportTokenTimestamp) < new Date(Date.now() - 1)) {
      return console.error('Too old of a request')
    }
  }

  console.log('Transport toke decrypted:', token)

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

  /* TODO: need to accept both x-user-token and x-transport-token
   * we should keep code minimal so we can delete x-user-token in future
   * we also want to check that the timestamp is within the minute or what
   * ever time value we set
   */

  //get transportToken private key from somewhere
  //const transportToken = crypto.publicEncrypt('some entropy')

  const x_user_token =
    req.headers['x-user-token'] || req.cookies['x-user-token']
  const x_transport_token =
    req.headers['x-transport-token'] || req.cookies['x-transport-token']
  console.log('Transport toke:', x_transport_token)
  if (x_user_token == null || x_transport_token == null) {
    res.writeHead(401, 'Access invalid for user', {
      'Content-Type': 'text/plain',
    })
    res.end('Invalid credentials')
  } else {
    const user = await models.Contact.findOne({ where: { isOwner: true } })
    let token: Buffer = new Buffer([])
    if (x_user_token != null) {
      token = x_user_token
    } else if (x_transport_token != null) {
      // Here we are extracting the x_user_token to use later
      // to validate that it is the correct one saved for the owner

      console.log('Transport Token: ', x_transport_token)
      token = crypto
        .privateDecrypt('privateKey', x_transport_token)
        .slice(0, 12)

      // We are extracting the timestamp from the x_transport_token
      // Need to figure out if this is the correct way to extract or if there
      // is a more sophisticated way
      const timestamp = crypto
        .privateDecrypt('privateKey', x_transport_token)
        .slice(13, 20)
      const timePeriod = 1

      // We want to check to see if the timestamp in the
      // x_transport_token is too old because then we
      // will not have a record of requests past that timestamp to
      // see if a x_transport_token is reused
      if (timestamp.readUInt32BE() < Date.now() - timePeriod) {
        return failure(res, 'request too old')
      }

      // Here we want to check if there is a saved request
      // that uses the same x_transport_token to stop a replay attack
      // TODO: should we save the data on redis if so we need to add redis to sphinx relay?
      const arrayOfRequests = []
      arrayOfRequests.forEach((requestItemTransportToken) => {
        if (x_transport_token == requestItemTransportToken) {
          return failure(res, 'duplicate x_transport_token used')
        }
      })
    }
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('base64')
    console.log('Auth User Token: ', user.authToken)
    console.log('Hashed User Token: ', hashedToken)
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
