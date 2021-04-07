import * as meme from "../utils/meme";
import { success, failure } from "../utils/res";
import * as tribes from "../utils/tribes";

export async function requestExternalTokens(req, res) {
  if (!req.owner) return failure(res, "no owner");
  const pubkey = req.owner.publicKey;
  try {
    const memeToken = await meme.getMediaToken(pubkey);
    const tribesToken = await tribes.genSignedTimestamp(pubkey);
    if(!memeToken || !tribesToken) {
      return failure(res, 'failed to generate token')
    }
    success(res, {
      memeToken, tribesToken
    })
  } catch (e) {
    failure(res, e);
  }
}
