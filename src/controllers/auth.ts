import { createJWT, scopes } from '../utils/jwt'
import { success, failure } from '../utils/res'
import { loadConfig } from '../utils/config'
import * as rsa from '../crypto/rsa'
import * as tribes from '../utils/tribes'
import { generateTransportTokenKeys } from '../utils/cert'
import * as fs from 'fs'
import { Req } from '../types'

const config = loadConfig()

interface MeInfo {
  pubkey: string
  photo_url: string
  alias: string
  route_hint: string
  contact_key: string
  price_to_meet: number
  jwt: string
}

export async function verifyAuthRequest(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  try {
    const sc = [scopes.PERSONAL, scopes.BOTS]
    const jot = createJWT(req.owner.publicKey, sc, 10080) // one week
    const bod: MeInfo = {
      pubkey: req.owner.publicKey,
      alias: req.owner.alias,
      photo_url: req.owner.photoUrl,
      route_hint: req.owner.routeHint,
      contact_key: req.owner.contactKey,
      price_to_meet: req.owner.priceToMeet,
      jwt: jot,
    }
    const token = await tribes.genSignedTimestamp(req.owner.publicKey)
    success(res, {
      info: bod,
      token,
    })
    // const protocol = j.host.includes("localhost") ? "http" : "https";
    // await fetch(`${protocol}://${j.host}/verify/${j.challenge}?token=${token}`, {
    //   method: "POST",
    //   body: JSON.stringify(bod),
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });
    // success(res, 'ok')
  } catch (e) {
    failure(res, e)
  }
}

export async function requestExternalTokens(req: Req, res) {
  if (!req.owner) return failure(res, 'no owner')
  try {
    const result: MeInfo = {
      pubkey: req.owner.publicKey,
      alias: req.owner.alias,
      photo_url: req.owner.photoUrl,
      route_hint: req.owner.routeHint,
      contact_key: req.owner.contactKey,
      price_to_meet: req.owner.priceToMeet,
      jwt: '',
    }
    success(res, result)
  } catch (e) {
    failure(res, e)
  }
}

export async function requestTransportKey(req: Req, res) {
  let transportPublicKey: string | null = null
  try {
    transportPublicKey = fs.readFileSync(
      config.transportPublicKeyLocation,
      'utf8'
    )
  } catch (e) {
    //We want to do nothing here
  }
  if (transportPublicKey != null) {
    success(res, { transport_key: transportPublicKey })
    return
  }

  const transportTokenKeys = await generateTransportTokenKeys()
  success(res, { transport_key: transportTokenKeys })
}
