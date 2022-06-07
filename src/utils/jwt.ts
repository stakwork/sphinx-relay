import * as nJwt from 'njwt'
import * as secureRandom from 'secure-random'
import { scopes } from '../scopes'

export * from '../scopes'

// each restart of relay creates new key
// to revoke any JWT out in the wild, just restart relay
const signingKey = secureRandom(256, { type: 'Buffer' })

export function createJWT(
  ownerPubkey: string,
  scopes: scopes[],
  minutes?: number
): string {
  const claims = {
    iss: 'relay',
    pubkey: ownerPubkey,
    scope: scopes ? scopes.join(',') : '',
  }
  const jwt = nJwt.create(claims, signingKey)
  const mins = minutes || 5
  jwt.setExpiration(new Date().getTime() + mins * 60 * 1000)
  return jwt.compact()
}

export function verifyJWT(token: string): nJwt.Jwt | undefined {
  try {
    return nJwt.verify(token, signingKey)
  } catch (e) {
    return
  }
}
