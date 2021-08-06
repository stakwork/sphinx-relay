import * as moment from 'moment'
import { urlBase64FromBytes } from '../utils/ldat'
import * as zbase32 from '../utils/zbase32'
import * as rp from 'request-promise'
import * as helpers from '../helpers'
import { loadConfig } from '../utils/config'
import * as Lightning from '../grpc/lightning'
import { logging } from './logger'

const config = loadConfig()

interface tokenStore {
  token: string
  ts: number // seconds
}
// {pubkey: {host: {token,ts} }}
const tokens: { [k: string]: { [k: string]: tokenStore } } = {}

export async function lazyToken(pubkey: string, host: string) {
  // console.log("[meme] lazyToken for", pubkey)
  if (tokens[pubkey] && tokens[pubkey][host]) {
    const ts = tokens[pubkey][host].ts
    const now = moment().unix()
    if (ts > now - 604700) {
      // in the last week
      return tokens[pubkey][host].token
    }
  }

  try {
    const t = await getMediaToken(pubkey, host)
    if (!tokens[pubkey]) tokens[pubkey] = {}
    tokens[pubkey][host] = {
      token: t,
      ts: moment().unix(),
    }
    return t
  } catch (e) {
    if (logging.Meme) console.log('[meme] error getting token', e)
  }
}

let mediaProtocol = 'https'
if (config.media_host.includes('localhost')) mediaProtocol = 'http'
if (config.media_host.includes('meme.sphinx:5555')) mediaProtocol = 'http'
let mediaURL = mediaProtocol + '://' + config.media_host + '/'

export async function getMediaToken(ownerPubkey: string, host?: string) {
  // console.log("[meme] gET MEDIA TOEKN", ownerPubkey)
  let protocol = 'https'
  if (host?.includes('localhost')) protocol = 'http'
  if (host?.includes('meme.sphinx:5555')) protocol = 'http'
  const theURL = host ? `${protocol}://${host}/` : mediaURL
  await helpers.sleep(300)
  try {
    const res = await rp.get(theURL + 'ask')
    const r = JSON.parse(res)
    if (!(r && r.challenge && r.id)) {
      throw new Error('no challenge')
    }
    const sig = await Lightning.signBuffer(
      Buffer.from(r.challenge, 'base64'),
      ownerPubkey
    )

    if (!sig) throw new Error('no signature')
    let pubkey: string = ownerPubkey

    const sigBytes = zbase32.decode(sig)
    const sigBase64 = urlBase64FromBytes(sigBytes)

    if (logging.Meme) console.log('[meme] verify', pubkey)
    const bod = await rp.post(theURL + 'verify', {
      form: { id: r.id, sig: sigBase64, pubkey },
    })
    const body = JSON.parse(bod)
    if (!(body && body.token)) {
      throw new Error('no token')
    }
    return body.token
  } catch (e) {
    throw e
  }
}
