import { existsSync, readFileSync, writeFile, mkdirSync } from 'fs'
import * as express from 'express'
import * as rsa from '../crypto/rsa'
import * as fs from 'fs'
import { sphinxLogger, logging } from './logger'
import * as qs from 'qs'
import axios from 'axios'
import * as forge from 'node-forge'
const apiUrl = 'https://api.zerossl.com'
import { loadConfig } from '../utils/config'
import { sleep } from '../helpers'

const config = loadConfig()

/**
Generates a Certificate Signing Request (CSR) with the given keys and endpoint.

@param {Object} keys The keys to use for generating the CSR.
@param {string} endpoint The endpoint to associate with the CSR.
@return {string} The generated CSR.
*/
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
    sphinxLogger.error('Verification of CSR failed.', logging.SSL)
    throw new Error('Verification of CSR failed.')
  }
  csr = forge.pki.certificationRequestToPem(csr)
  return csr.trim()
}

/**
Makes a request to the specified URL to obtain a certificate.

@param {string} endpoint - The endpoint to request a certificate for.
@param {string} csr - The certificate signing request (CSR) for the endpoint.
@param {string} apiKey - The API key to authenticate the request.
@returns {Object} - The response data from the request.
*/
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

/**
Validates the provided certificate for the given endpoint by starting a
temporary HTTP server, issuing a request for validation, and waiting for
the certificate to be issued.

@param {number} port - The port number to use for the temporary HTTP server.
@param {object} data - The certificate data returned from the API.
@param {string} endpoint - The certificate endpoint (e.g. "example.com").
@param {string} apiKey - The API key for the certificate issuer.

@returns {void}
*/
async function validateCert(port, data, endpoint, apiKey) {
  const app = express()
  const validationObject = data.validation.other_methods[endpoint]
  const replacement = new RegExp(`http://${endpoint}`, 'g')
  const path = validationObject.file_validation_url_http.replace(
    replacement,
    ''
  )
  await app.get(path, (req, res) => {
    res.set('Content-Type', 'text/plain')
    res.send(validationObject.file_validation_content.join('\n'))
  })
  const server = await app.listen(port, () => {
    sphinxLogger.info(
      `validation server started at http://0.0.0.0:${port}`,
      logging.SSL
    )
  })
  await requestValidation(data.id, apiKey)
  sphinxLogger.info(`waiting for certificate to be issued`, logging.SSL)
  while (true) {
    const certData = await getCert(data.id, apiKey)
    if (certData.status === 'issued') {
      sphinxLogger.info(`certificate was issued`, logging.SSL)
      break
    }
    sphinxLogger.info(`checking certificate again...`, logging.SSL)
    await sleep(2000)
  }
  await server.close(() => {
    sphinxLogger.info(`validation server stopped.`, logging.SSL)
  })
  return
}

/**
Requests certificate validation for the specified certificate id.

@param {string} id - The certificate id
@param {string} apiKey - The API key to use for the request
@returns {Object} The response data
*/
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
    sphinxLogger.error(`Failed to request certificate validation`, logging.SSL)
    sphinxLogger.error(res.data, logging.SSL)
    throw new Error('Failing to provision ssl certificate')
  }
  return res.data
}

/**
Makes a GET request to the /certificates/{id} endpoint of the SSL API to get certificate data.

@param {string} id - The ID of the certificate to get.
@param {string} apiKey - The API key for authentication.
@returns {Object} - The data for the certificate with the specified ID.
*/
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

/**
Asynchronously downloads a certificate.

@param {string} id - The certificate ID
@param {string} apiKey - The API key to authenticate the request
@return {Promise<Object>} - An object containing the certificate data
*/
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

/**
Retrieve a TLS certificate for the specified domain.

@param {string} domain - The domain to retrieve a TLS certificate for.
@param {number} port - The port number to listen on for certificate validation.
@param {boolean} save_ssl - Whether to save the certificate and private key to disk.
@returns {Object} - An object containing the private key, certificate, and CA bundle.
*/
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
    sphinxLogger.error('ZEROSSL_API_KEY is not set', logging.SSL)
    throw new Error('ZEROSSL_API_KEY is not set')
  }
  const endpoint_tmp = domain.replace('https://', '')
  const endpoint = endpoint_tmp.replace(':3001', '')
  const keys = forge.pki.rsa.generateKeyPair(2048)
  const csr = generateCsr(keys, endpoint)
  sphinxLogger.info(`Generated CSR`, logging.SSL)
  const res = await requestCert(endpoint, csr, apiKey)
  sphinxLogger.info(`Requested certificate`, logging.SSL)
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
        sphinxLogger.info(`wrote tls certificate`, logging.SSL)
      }
    )
    await writeFile(
      __dirname + '/zerossl/ca.cert',
      certData['ca_bundle.crt'],
      function (err) {
        if (err) {
          return sphinxLogger.error(err)
        }
        sphinxLogger.info(`wrote tls ca bundle`, logging.SSL)
      }
    )
    await writeFile(
      __dirname + '/zerossl/tls.key',
      forge.pki.privateKeyToPem(keys.privateKey),
      function (err) {
        if (err) {
          return sphinxLogger.error(err)
        }
        sphinxLogger.info(`wrote tls key`, logging.SSL)
      }
    )
  }
  return {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    certificate: certData['certificate.crt'],
    caBundle: certData['ca_bundle.crt'],
  }
}

interface GetAndDecryptTransportTokenReturn {
  token: string
  timestamp: number
}
async function getAndDecryptTransportToken(
  t: string
): Promise<GetAndDecryptTransportTokenReturn> {
  const transportPrivateKey = await getTransportKey()
  const splitTransportToken = rsa.decrypt(transportPrivateKey, t).split('|')
  const token = splitTransportToken[0]
  const timestamp = parseInt(splitTransportToken[1])
  return { token, timestamp }
}

async function getTransportKey() {
  if (!fs.existsSync(config.transportPrivateKeyLocation)) {
    await generateTransportTokenKeys()
  }
  return fs.readFileSync(config.transportPrivateKeyLocation, 'utf8')
}

async function generateTransportTokenKeys(): Promise<string> {
  const transportTokenKeys = await rsa.genKeys()
  fs.writeFileSync(config.transportPublicKeyLocation, transportTokenKeys.public)
  fs.writeFileSync(
    config.transportPrivateKeyLocation,
    transportTokenKeys.private
  )
  return transportTokenKeys.public
}

export {
  getCertificate,
  generateTransportTokenKeys,
  getTransportKey,
  getAndDecryptTransportToken,
}
