import { existsSync, readFileSync, writeFile, mkdirSync } from 'fs'
import * as express from 'express'
const qs = require('qs')
const axios = require('axios')
var forge = require('node-forge')
const apiUrl = 'https://api.zerossl.com'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateCsr(keys, endpoint) {
  var csr = forge.pki.createCertificationRequest()
  csr.publicKey = keys.publicKey
  csr.setSubject([
    {
      name: 'commonName',
      value: endpoint,
    },
  ])
  csr.sign(keys.privateKey)
  if (!csr.verify()) {
    throw new Error('=> [ssl] Verification of CSR failed.')
  }
  var csr = forge.pki.certificationRequestToPem(csr)
  return csr.trim()
}

async function requestCert(endpoint, csr, apiKey) {
  let res = await axios({
    method: 'post',
    url: `${apiUrl}/certificates?access_key=${apiKey}`,
    data: qs.stringify({
      certificate_domains: endpoint,
      certificate_validity_days: '90',
      certificate_csr: csr,
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
  return res.data
}

async function validateCert(port, data, endpoint, apiKey) {
  const app = express()
  var validationObject = data.validation.other_methods[endpoint]
  var replacement = new RegExp(`http://${endpoint}`, 'g')
  var path = validationObject.file_validation_url_http.replace(replacement, '')
  await app.get(path, (req, res) => {
    res.set('Content-Type', 'text/plain')
    res.send(validationObject.file_validation_content.join('\n'))
  })
  let server = await app.listen(port, () => {
    console.log(`=> [ssl] validation server started at http://0.0.0.0:${port}`)
  })
  await requestValidation(data.id, apiKey)
  console.log('=> [ssl] waiting for certificate to be issued')
  while (true) {
    let certData = await getCert(data.id, apiKey)
    if (certData.status === 'issued') {
      console.log('=> [ssl] certificate was issued')
      break
    }
    console.log('=> [ssl] checking certificate again...')
    await sleep(2000)
  }
  await server.close(() => {
    console.log('=> [ssl] validation server stopped.')
  })
  return
}

async function requestValidation(id, apiKey) {
  let res = await axios({
    method: 'post',
    url: `${apiUrl}/certificates/${id}/challenges?access_key=${apiKey}`,
    data: qs.stringify({
      validation_method: 'HTTP_CSR_HASH',
    }),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
  if (res.data.success === false) {
    console.log('=> [ssl] Failed to request certificate validation')
    console.log(res.data)
    throw new Error('=> [ssl] Failing to provision ssl certificate')
  }
  return res.data
}

async function getCert(id, apiKey) {
  let res = await axios({
    method: 'get',
    url: `${apiUrl}/certificates/${id}?access_key=${apiKey}`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
  return res.data
}

async function downloadCert(id, apiKey) {
  let res = await axios({
    method: 'get',
    url: `${apiUrl}/certificates/${id}/download/return?access_key=${apiKey}`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
  return res.data
}

async function getCertificate(domain, port, save_ssl) {
  if (
    existsSync(__dirname + '/zerossl/tls.cert') &&
    existsSync(__dirname + '/zerossl/tls.key')
  ) {
    var certificate = readFileSync(
      __dirname + '/zerossl/tls.cert',
      'utf-8'
    ).toString()
    var caBundle = readFileSync(
      __dirname + '/zerossl/ca.cert',
      'utf-8'
    ).toString()
    var privateKey = readFileSync(
      __dirname + '/zerossl/tls.key',
      'utf-8'
    ).toString()
    return {
      privateKey: privateKey,
      certificate: certificate,
      caBundle: caBundle,
    }
  }
  var apiKey = process.env.ZEROSSL_API_KEY
  if (!apiKey) {
    throw new Error('=> [ssl] ZEROSSL_API_KEY is not set')
  }
  var endpoint_tmp = domain.replace('https://', '')
  var endpoint = endpoint_tmp.replace(':3001', '')
  var keys = forge.pki.rsa.generateKeyPair(2048)
  var csr = generateCsr(keys, endpoint)
  console.log('=> [ssl] Generated CSR')
  var res = await requestCert(endpoint, csr, apiKey)
  console.log('=> [ssl] Requested certificate')
  await validateCert(port, res, endpoint, apiKey)
  var certData = await downloadCert(res.id, apiKey)
  if (save_ssl === true) {
    if (!existsSync(__dirname + '/zerossl')) {
      await mkdirSync(__dirname + '/zerossl')
    }
    await writeFile(
      __dirname + '/zerossl/tls.cert',
      certData['certificate.crt'],
      function (err) {
        if (err) {
          return console.log(err)
        }
        console.log('=> [ssl] wrote tls certificate')
      }
    )
    await writeFile(
      __dirname + '/zerossl/ca.cert',
      certData['ca_bundle.crt'],
      function (err) {
        if (err) {
          return console.log(err)
        }
        console.log('=> [ssl] wrote tls ca bundle')
      }
    )
    await writeFile(
      __dirname + '/zerossl/tls.key',
      forge.pki.privateKeyToPem(keys.privateKey),
      function (err) {
        if (err) {
          return console.log(err)
        }
        console.log('=> [ssl] wrote tls key')
      }
    )
  }
  return {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    certificate: certData['certificate.crt'],
    caBundle: certData['ca_bundle.crt'],
  }
}

export { getCertificate }
