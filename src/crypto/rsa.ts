import * as crypto from 'crypto'

const BLOCK_SIZE = 256
const MAX_CHUNK_SIZE = BLOCK_SIZE - 11 // 11 is the PCKS1 padding

export interface KeyPair {
  public: string,
  private: string
}

export function encrypt(key: string, txt: string): string {
  try {
    const buf = Buffer.from(txt)
    let finalBuf = Buffer.alloc(0)
    const n = Math.ceil(buf.length / MAX_CHUNK_SIZE)
    const pubc = cert.pub(key)
    for (let i = 0; i < n; i++) {
      const f = crypto.publicEncrypt(
        {
          key: pubc,
          padding: crypto.constants.RSA_PKCS1_PADDING, // RSA_PKCS1_OAEP_PADDING
        },
        buf.subarray(i * MAX_CHUNK_SIZE, i * MAX_CHUNK_SIZE + MAX_CHUNK_SIZE)
      )
      finalBuf = Buffer.concat([ finalBuf, f ])
    }
    return finalBuf.toString('base64')
  } catch (e) {
    return ''
  }
}

export function decrypt(privateKey: string | Buffer, enc: string): string {
  try {
    const buf = Buffer.from(enc, 'base64')
    let finalDec = ''
    const n = Math.ceil(buf.length / BLOCK_SIZE)
    const privc = cert.priv(privateKey)
    for (let i = 0; i < n; i++) {
      const b = crypto.privateDecrypt(
        {
          key: privc,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        buf.subarray(i * BLOCK_SIZE, i * BLOCK_SIZE + BLOCK_SIZE)
      )
      finalDec += b.toString('utf-8')
    }
    return finalDec
  } catch (e) {
    return ''
  }
}

export function genKeys(): Promise<KeyPair> {
  return new Promise(resolve => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
      },
      (err, publicKey, privKey) => {
        if (err) {
          // TODO handle error
        }
        const pubPEM = publicKey.export({
          type: 'pkcs1',
          format: 'pem',
        })
        const pubBase64 = cert.unpub(pubPEM.toString())
        const privPEM = privKey.export({
          type: 'pkcs1',
          format: 'pem',
        })
        const privBase64 = cert.unpriv(privPEM.toString())
        resolve(<KeyPair>{
          public: pubBase64,
          private: privBase64,
        })
      }
    )
  })
}

export function testRSA(): void {
  crypto.generateKeyPair(
    'rsa',
    {
      modulusLength: 2048,
    },
    (err, publicKey, privateKey) => {
      if (err) console.log('error', err)
      const pubPEM = publicKey.export({
        type: 'pkcs1',
        format: 'pem',
      })
      const pub = cert.unpub(pubPEM.toString())

      const msg = 'hi'
      const enc = encrypt(pub, msg)

      const privPEM = privateKey.export({
        type: 'pkcs1',
        format: 'pem',
      })
      const priv = cert.unpriv(privPEM.toString())

      const dec = decrypt(priv, enc)
      console.log(`SUCCESS: ${msg === dec}`)
    }
  )
}

const beginPub = '-----BEGIN RSA PUBLIC KEY-----'
const endPub = '-----END RSA PUBLIC KEY-----'
const beginPriv = '-----BEGIN RSA PRIVATE KEY-----'
const endPriv = '-----END RSA PRIVATE KEY-----'

const cert = {
  unpub:  (key: string): string => key.replace(beginPub,  '').replace(endPub,  '').trim(),
  unpriv: (key: string): string => key.replace(beginPriv, '').replace(endPriv, '').trim(),
  pub:    (key: string | Buffer): string => beginPub  + '\n' + key + '\n' + endPub,
  priv:   (key: string | Buffer): string => beginPriv + '\n' + key + '\n' + endPriv
}
