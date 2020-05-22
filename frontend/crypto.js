import * as crypto from "crypto-browserify";

export function encrypt(key, txt){
  try{
    const pubc = cert.pub(key)
    const buf = crypto.publicEncrypt({
      key:pubc,
      padding:crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(txt,'utf-8'))
    return buf.toString('base64')
  } catch(e) {
    return ''
  }
}

export function decrypt(privateKey, enc){
  try{
    const privc = cert.priv(privateKey)
    const buf = crypto.privateDecrypt({
      key:privc,
      padding:crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(enc,'base64'))
    return buf.toString('utf-8')
  } catch(e) {
    return ''
  }
}

export function genKeys(){
  return new Promise((resolve, reject)=>{
    crypto.generateKeyPair('rsa', {
      modulusLength: 2048
    }, (err, publicKey, privKey)=>{
      const pubPEM = publicKey.export({
        type:'pkcs1',format:'pem'
      })
      const pubBase64 = cert.unpub(pubPEM)
      const privPEM = privKey.export({
        type:'pkcs1',format:'pem'
      })
      const privBase64 = cert.unpriv(privPEM)
      resolve({
        public: pubBase64,
        private: privBase64,
      })
    })
  })
}

export function testRSA(){
  crypto.generateKeyPair('rsa', {
    modulusLength: 2048
  }, (err, publicKey, priv)=>{
    const pubPEM = publicKey.export({
      type:'pkcs1',format:'pem'
    })
    const pub = cert.unpub(pubPEM)

    const msg = 'hi'
    const enc = encrypt(pub, msg)

    const dec = decrypt(priv, enc)
    console.log("FINAL:",dec)
  })
}

const cert = {
  unpub: function(key){
    let s = key
    s = s.replace('-----BEGIN RSA PUBLIC KEY-----','')
    s = s.replace('-----END RSA PUBLIC KEY-----','')
    return s.replace(/[\r\n]+/gm, '')
  },
  unpriv: function(key){
    let s = key
    s = s.replace('-----BEGIN RSA PRIVATE KEY-----','')
    s = s.replace('-----END RSA PRIVATE KEY-----','')
    return s.replace(/[\r\n]+/gm, '')
  },
  pub:function(key){
    return '-----BEGIN RSA PUBLIC KEY-----\n' +
      key + '\n' +
      '-----END RSA PUBLIC KEY-----'
  },
  priv:function(key){
    return '-----BEGIN RSA PRIVATE KEY-----\n' +
      key + '\n' +
      '-----END RSA PRIVATE KEY-----'
  }
}
