import * as crypto from 'crypto'

export const ALGO = 'sha256'

// rawBody: utf8 string
// secret: hex encoded
export function sign(rawBody: string, secret: string): Buffer {
  if (!rawBody || !secret) {
    throw new Error('hmac missing data')
  }
  const hmac = crypto.createHmac(ALGO, secret)
  return Buffer.from(
    ALGO + '=' + hmac.update(Buffer.from(rawBody)).digest('hex'),
    'utf8'
  )
}

export function verifyHmac(
  signature: string,
  rawBody: string,
  secret: string
): boolean {
  if (!rawBody || !secret) {
    return false
  }
  try {
    const sig = Buffer.from(signature || '', 'utf8')
    const digest = sign(rawBody, secret)
    if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
      return false
    }
  } catch (e) {
    return false
  }
  return true
}
