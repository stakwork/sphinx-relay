import {createJWT, scopes} from "../utils/jwt";
import { success, failure } from "../utils/res";
import * as tribes from "../utils/tribes";

interface MeInfo {
  photo_url: string
  alias: string
  route_hint: string
  contact_key: string
  jwt: string
}

export async function verifyAuthRequest(req, res) {
  if (!req.owner) return failure(res, "no owner");
  try {
    const sc = [scopes.PERSONAL]
    const jot = createJWT(req.owner.publicKey, sc)
    const bod:MeInfo = {
      alias: req.owner.alias,
      photo_url: req.owner.photoUrl,
      route_hint: req.owner.routeHint,
      contact_key: req.owner.contactKey,
      jwt: jot,
    }
    const token = await tribes.genSignedTimestamp(req.owner.publicKey)
    success(res, {
      info: bod,
      token
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
  } catch(e) {
    failure(res, e)
  }
}

export async function requestExternalTokens(req, res) {
  if (!req.owner) return failure(res, "no owner");
  try {
    const result:MeInfo = {
      alias: req.owner.alias,
      photo_url: req.owner.photoUrl,
      route_hint: req.owner.routeHint,
      contact_key: req.owner.contactKey,
      jwt: ''
    }
    success(res, result)
  } catch (e) {
    failure(res, e);
  }
}
