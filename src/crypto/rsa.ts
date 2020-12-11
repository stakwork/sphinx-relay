import * as crypto from "crypto";

const BLOCK_SIZE = 256
const MAX_CHUNK_SIZE = BLOCK_SIZE - 11 // 11 is the PCKS1 padding

export function encrypt(key, txt) {
  try {
    const buf = Buffer.from(txt)
    let finalBuf = Buffer.from([])
    const n = Math.ceil(buf.length / MAX_CHUNK_SIZE)
    const arr = Array(n).fill(0)
    const pubc = cert.pub(key)
    arr.forEach((_, i) => {
      const f = crypto.publicEncrypt({
        key: pubc,
        padding: crypto.constants.RSA_PKCS1_PADDING, // RSA_PKCS1_OAEP_PADDING
      }, buf.subarray(i * MAX_CHUNK_SIZE, i * MAX_CHUNK_SIZE + MAX_CHUNK_SIZE))
      finalBuf = Buffer.concat([finalBuf, f])
    })
    return finalBuf.toString('base64')
  } catch (e) {
    return ''
  }
}

export function decrypt(privateKey, enc) {
  try {
    const buf = Buffer.from(enc, 'base64')
    let finalDec = ''
    const n = Math.ceil(buf.length / BLOCK_SIZE)
    const arr = Array(n).fill(0)
    const privc = cert.priv(privateKey)
    arr.forEach((_, i) => {
      const b = crypto.privateDecrypt({
        key: privc,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      }, buf.subarray(i * BLOCK_SIZE, i * BLOCK_SIZE + BLOCK_SIZE))
      finalDec += b.toString('utf-8')
    })
    return finalDec
  } catch (e) {
    return ''
  }
}

export function genKeys(): Promise<{ [k: string]: string }> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair('rsa', {
      modulusLength: 2048
    }, (err, publicKey, privKey) => {
      const pubPEM = publicKey.export({
        type: 'pkcs1', format: 'pem'
      })
      const pubBase64 = cert.unpub(pubPEM)
      const privPEM = privKey.export({
        type: 'pkcs1', format: 'pem'
      })
      const privBase64 = cert.unpriv(privPEM)
      resolve({
        public: pubBase64,
        private: privBase64,
      })
    })
  })
}

export function testRSA() {
  crypto.generateKeyPair('rsa', {
    modulusLength: 2048
  }, (err, publicKey, privateKey) => {
    const pubPEM = publicKey.export({
      type: 'pkcs1', format: 'pem'
    })
    const pub = cert.unpub(pubPEM)

    const msg = 'hi'
    const enc = encrypt(pub, msg)

    const privPEM = privateKey.export({
      type: 'pkcs1', format: 'pem'
    })
    const priv = cert.unpriv(privPEM)

    const dec = decrypt(priv, enc)
    console.log("SUCESS:", msg === dec)
  })
}

const cert = {
  unpub: function (key) {
    let s = key
    s = s.replace('-----BEGIN RSA PUBLIC KEY-----', '')
    s = s.replace('-----END RSA PUBLIC KEY-----', '')
    return s.replace(/[\r\n]+/gm, '')
  },
  unpriv: function (key) {
    let s = key
    s = s.replace('-----BEGIN RSA PRIVATE KEY-----', '')
    s = s.replace('-----END RSA PRIVATE KEY-----', '')
    return s.replace(/[\r\n]+/gm, '')
  },
  pub: function (key) {
    return '-----BEGIN RSA PUBLIC KEY-----\n' +
      key + '\n' +
      '-----END RSA PUBLIC KEY-----'
  },
  priv: function (key) {
    return '-----BEGIN RSA PRIVATE KEY-----\n' +
      key + '\n' +
      '-----END RSA PRIVATE KEY-----'
  }
}
