import * as fs from 'fs'
import { createJWT, scopes } from '../utils/jwt'
import { success, failure } from '../utils/res'
import { loadConfig } from '../utils/config'
import * as tribes from '../utils/tribes'
import { generateTransportTokenKeys } from '../utils/cert'
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

/**
 *Verify an auth request.
 *@param {Req} req - The request object
 *@param {Response} res - The response object
 *@returns {Promise<void>}
 **/
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
  } catch (e) {
    failure(res, e)
  }
}

/**
 *Returns information about the authenticated user
 *@param {Object} req - The request object
 *@param {Object} res - The response object
 *@returns {Object} - Returns an object with information about the authenticated user
 **/
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

/**
 * This function is an Express.js route handler that is used to handle HTTP requests to the /requestTransportKey endpoint. The function retrieves the transport key (public key) from the specified location in the config object, or generates a new transport key if one is not found. The transport key is then returned in the response.

@param {Req} req - The Express.js request object containing information about the incoming request.
@param {Response} res - The Express.js response object used to send a response back to the client.

@returns {void} - This function does not return a value. It sends the transport key in the response.
*/
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
