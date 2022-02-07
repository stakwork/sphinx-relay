import { existsSync, readFileSync, writeFile, mkdirSync } from 'fs'
import * as express from 'express'
import { sphinxLogger } from './logger'
import qs = require('qs')
import axios = require('axios')
import forge = require('node-forge')
const apiUrl = 'https://api.zerossl.com'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateCsr(keys, endpoint) {
  let csr = forge.pki.createCertificationRequest()
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
  csr = forge.pki.certificationRequestToPem(csr)
  return csr.trim()
}

async function requestCert(endpoint, csr, apiKey) {
  const res = await axios({
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
  const validationObject = data.validation.other_methods[endpoint]
  const replacement = new RegExp(`http://${endpoint}`, 'g')
  const path = validationObject.file_validation_url_http.replace(replacement, '')
  await app.get(path, (req, res) => {
    res.set('Content-Type', 'text/plain')
    res.send(validationObject.file_validation_content.join('\n'))
  })
  const server = await app.listen(port, () => {
    sphinxLogger.info(
      `=> [ssl] validation server started at http://0.0.0.0:${port}`
    )
  })
  await requestValidation(data.id, apiKey)
  sphinxLogger.info(`=> [ssl] waiting for certificate to be issued`)
  while (true) {
    const certData = await getCert(data.id, apiKey)
    if (certData.status === 'issued') {
      sphinxLogger.info(`=> [ssl] certificate was issued`)
      break
    }
    sphinxLogger.info(`=> [ssl] checking certificate again...`)
    await sleep(2000)
  }
  await server.close(() => {
    sphinxLogger.info(`=> [ssl] validation server stopped.`)
  })
  return
}

async function requestValidation(id, apiKey) {
  const res = await axios({
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
    sphinxLogger.error(`=> [ssl] Failed to request certificate validation`)
    sphinxLogger.error(res.data)
    throw new Error('=> [ssl] Failing to provision ssl certificate')
  }
  return res.data
}

async function getCert(id, apiKey) {
  const res = await axios({
    method: 'get',
    url: `${apiUrl}/certificates/${id}?access_key=${apiKey}`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
  return res.data
}

async function downloadCert(id, apiKey) {
  const res = await axios({
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
    const certificate = readFileSync(
      __dirname + '/zerossl/tls.cert',
      'utf-8'
    ).toString()
    const caBundle = readFileSync(
      __dirname + '/zerossl/ca.cert',
      'utf-8'
    ).toString()
    const privateKey = readFileSync(
      __dirname + '/zerossl/tls.key',
      'utf-8'
    ).toString()
    return {
      privateKey: privateKey,
      certificate: certificate,
      caBundle: caBundle,
    }
  }
  const apiKey = process.env.ZEROSSL_API_KEY
  if (!apiKey) {
    throw new Error('=> [ssl] ZEROSSL_API_KEY is not set')
  }
  const endpoint_tmp = domain.replace('https://', '')
  const endpoint = endpoint_tmp.replace(':3001', '')
  const keys = forge.pki.rsa.generateKeyPair(2048)
  const csr = generateCsr(keys, endpoint)
  sphinxLogger.info(`=> [ssl] Generated CSR`)
  const res = await requestCert(endpoint, csr, apiKey)
  sphinxLogger.info(`=> [ssl] Requested certificate`)
  await validateCert(port, res, endpoint, apiKey)
  const certData = await downloadCert(res.id, apiKey)
  if (save_ssl === true) {
    if (!existsSync(__dirname + '/zerossl')) {
      await mkdirSync(__dirname + '/zerossl')
    }
    await writeFile(
      __dirname + '/zerossl/tls.cert',
      certData['certificate.crt'],
      function (err) {
        if (err) {
          return sphinxLogger.error(err)
        }
        sphinxLogger.info(`=> [ssl] wrote tls certificate`)
      }
    )
    await writeFile(
      __dirname + '/zerossl/ca.cert',
      certData['ca_bundle.crt'],
      function (err) {
        if (err) {
          return sphinxLogger.error(err)
        }
        sphinxLogger.info(`=> [ssl] wrote tls ca bundle`)
      }
    )
    await writeFile(
      __dirname + '/zerossl/tls.key',
      forge.pki.privateKeyToPem(keys.privateKey),
      function (err) {
        if (err) {
          return sphinxLogger.error(err)
        }
        sphinxLogger.info(`=> [ssl] wrote tls key`)
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
