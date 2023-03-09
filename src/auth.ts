import * as crypto from 'crypto'
import { models, ContactRecord } from './models'
import * as cryptoJS from 'crypto-js'
import { success, failure, unauthorized } from './utils/res'
import { setInMemoryMacaroon } from './utils/macaroon'
import { loadConfig } from './utils/config'
import { isProxy } from './utils/proxy'
import * as jwtUtils from './utils/jwt'
import { allowedJwtRoutes } from './scopes'
import * as hmac from './crypto/hmac'
import { Req, Res } from './types'
import * as fs from 'fs'
import { getAndDecryptTransportToken } from './utils/cert'
import moment = require('moment')

const config = loadConfig()

export async function unlocker(req: Req, res): Promise<boolean> {
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

export async function hmacMiddleware(req: Req, res: Res, next): Promise<void> {
  if (no_auth(req.path)) {
    next()
    return
  }
  // creating hmac key for the first time does not require one of course
  // and for getting the encrypted key
  if (req.path == '/hmac_key') {
    next()
    return
  }
  // opt-in feature
  if (!req.owner.hmacKey) {
    next()
    return
  }
  // req.headers['x-hub-signature-256']
  const sig = req.headers['x-hmac'] || req.cookies['x-hmac']
  if (!sig) {
    // FIXME optional sig for now
    next()
    return
  }
  const message = `${req.method}|${req.originalUrl}|${req.rawBody || ''}`
  const valid = hmac.verifyHmac(sig, message, req.owner.hmacKey)
  // console.log('valid sig!', valid)
  if (!valid) {
    return unauthorized(res)
  }
  next()
}

export async function proxyAdminMiddleware(
  req: Req,
  res: Res,
  next
): Promise<void> {
  if (no_auth(req.path)) {
    next()
    return
  }
  if (!req.owner) return unauthorized(res)
  if (!req.owner.isAdmin) return unauthorized(res)
  if (!isProxy()) return unauthorized(res)
  next()
}

function no_auth(path) {
  return (
    path == '/app' ||
    path == '/is_setup' ||
    path == '/' ||
    path == '/unlock' ||
    path == '/info' ||
    path == '/action' ||
    path == '/contacts/tokens' ||
    path == '/latest' ||
    path.startsWith('/static') ||
    path == '/contacts/set_dev' ||
    path == '/connect' ||
    path == '/connect_peer' ||
    path == '/peered' ||
    path == '/request_transport_key' ||
    path == '/webhook' ||
    path == '/has_admin' ||
    path == '/initial_admin_pubkey'
  )
}

export async function ownerMiddleware(req: Req, res: Res, next) {
  if (no_auth(req.path)) {
    next()
    return
  }

  // Here we are grabing both the x-user-token and x-transport-token
  const x_user_token =
    req.headers['x-user-token'] || req.cookies['x-user-token']
  const x_transport_token =
    req.headers['x-transport-token'] || req.cookies['x-transport-token']
  const x_admin_token =
    req.headers['x-admin-token'] || req.cookies['x-admin-token']

  // default assign token to x-user-token
  let token = x_user_token || x_admin_token
  let timestamp = 0

  if (x_transport_token) {
    const decrypted = await getAndDecryptTransportToken(x_transport_token)
    token = decrypted.token
    timestamp = decrypted.timestamp
  }

  if (process.env.HOSTING_PROVIDER === 'true') {
    if (token) {
      // add owner in anyway
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('base64')
      const owner: ContactRecord = (await models.Contact.findOne({
        where: { authToken: hashedToken, isOwner: true },
      })) as ContactRecord
      if (owner) {
        req.owner = owner.dataValues
      }
    } else if (!isProxy()) {
      const owner2: ContactRecord = (await models.Contact.findOne({
        where: { isOwner: true },
      })) as ContactRecord
      if (owner2) req.owner = owner2.dataValues
    }
    if (req.path === '/invoices') {
      next()
      return
    }
  }

  const jwt = req.headers['x-jwt'] || req.cookies['x-jwt']

  if (!token && !jwt) {
    res.status(401)
    res.end('Invalid credentials - no token or jwt')
    return
  }

  let owner: ContactRecord | undefined

  // find by auth token
  if (token) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('base64')
    owner = (await models.Contact.findOne({
      where: { authToken: hashedToken, isOwner: true },
    })) as ContactRecord
    if (x_admin_token) {
      if (!owner.isAdmin) {
        res.status(401)
        res.end('Invalid credentials - not admin')
        return
      }
    }
  }

  // find by JWT
  if (jwt) {
    const parsed = jwtUtils.verifyJWT(jwt)
    if (parsed) {
      const publicKey = (parsed.body as any).pubkey
      const allowed = allowedJwtRoutes(parsed.body, req.path)
      if (allowed && publicKey) {
        owner = (await models.Contact.findOne({
          where: { publicKey, isOwner: true },
        })) as ContactRecord
      }
    }
  }

  if (!owner) {
    res.status(401)
    res.end('Invalid credentials - no owner')
    return
  }

  if (x_transport_token) {
    if (!timestamp) {
      res.status(401)
      res.end('Invalid credentials - no ts')
      return
    }
    if (owner.lastTimestamp) {
      // console.log('=> received timestamp', timestamp)
      let thisTimestamp = momentFromTimestamp(timestamp)
      const lastTimestamp = momentFromTimestamp(owner.lastTimestamp)
      if (thisTimestamp.isBefore(lastTimestamp)) {
        // FIXME this needs to be:
        // if (!thisTimestamp.isAfter(lastTimestamp)) {
        res.status(401)
        res.end('Invalid credentials - timestamp too soon')
        return
      }
    }
    await owner.update({ lastTimestamp: timestamp })
  }
  req.owner = owner.dataValues
  next()
}

// support either 10-digit timestamp (unix) or 13-digit (js-style)
function momentFromTimestamp(ts: number) {
  if ((ts + '').length === 10) {
    return moment.unix(ts)
  } else {
    return moment(ts)
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
