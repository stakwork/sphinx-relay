import * as fs from 'fs'
import * as grpc from '@grpc/grpc-js'
import { loadProto } from './proto'
import { NodeClient } from './types/greenlight/Node'
import type { SchedulerClient } from './types/scheduler/Scheduler'
import libhsmd from './libhsmd'
import { loadConfig } from '../utils/config'
import * as crypto from 'crypto'
import * as interfaces from './interfaces'
import { loadLightning } from './lightning'
import * as Lightning from './lightning'
import { sphinxLogger } from '../utils/logger'

let GID: GreenlightIdentity

const config = loadConfig()

export async function initGreenlight(): Promise<void> {
  sphinxLogger.info('=> initGreenlight')
  // if (GID && GID.initialized) return
  await startGreenlightInit()
  // await streamHsmRequests()
}

export function keepalive(): void {
  sphinxLogger.info('=> Greenlight keepalive')
  setInterval(() => {
    Lightning.getInfo()
  }, 59000)
}

// let schedulerClient: SchedulerClient | undefined

const loadSchedulerCredentials = () => {
  const glCert = fs.readFileSync(config.scheduler_tls_location)
  const glPriv = fs.readFileSync(config.scheduler_key_location)
  const glChain = fs.readFileSync(config.scheduler_chain_location)
  return grpc.credentials.createSsl(glCert, glPriv, glChain)
}

function loadScheduler(): SchedulerClient {
  // 35.236.110.178:2601
  const descriptor = loadProto('scheduler')
  const scheduler = descriptor.scheduler
  const options = {
    'grpc.ssl_target_name_override': 'localhost',
  }
  return new scheduler.Scheduler(
    '35.236.110.178:2601',
    loadSchedulerCredentials(),
    options
  )
}

let GREENLIGHT_GRPC_URI = ''

export function get_greenlight_grpc_uri(): string {
  return GREENLIGHT_GRPC_URI
}

interface GreenlightIdentity {
  node_id: string
  bip32_key: string
  bolt12_key: string
  initialized: boolean
}
export async function startGreenlightInit(): Promise<void> {
  sphinxLogger.info('=> startGreenlightInit')
  try {
    let needToRegister = false
    const secretPath = config.hsm_secret_path
    let rootkey: string
    if (!fs.existsSync(secretPath)) {
      needToRegister = true
      rootkey = crypto.randomBytes(32).toString('hex')
    } else {
      rootkey = fs.readFileSync(secretPath).toString('hex')
    }
    const msgHex = libhsmd.Init(rootkey, 'bitcoin')
    const msg = Buffer.from(msgHex, 'hex')
    // console.log("INIT MSG LENGTH", msg.length)
    const node_id = msg.subarray(2, 35)
    const bip32_key = msg.subarray(35, msg.length - 32)
    const bolt12_key = msg.subarray(msg.length - 32, msg.length)
    GID = {
      node_id: node_id.toString('hex'),
      bip32_key: bip32_key.toString('hex'),
      bolt12_key: bolt12_key.toString('hex'),
      initialized: false,
    }
    if (needToRegister) {
      await registerGreenlight(GID, rootkey, secretPath)
    }
    const keyLoc = config.tls_key_location
    const noNeedToRecover = fs.existsSync(keyLoc)
    if (!noNeedToRecover) {
      await recoverGreenlight(GID)
    }
    const r = await schedule(GID.node_id)
    sphinxLogger.info('Greenlight pubkey', r.node_id.toString('hex'))
    GID.initialized = true
  } catch (e) {
    sphinxLogger.error(`initGreenlight error ${e}`)
  }
}

interface ScheduleResponse {
  node_id: Buffer
  grpc_uri: string
}
export function schedule(pubkey: string): Promise<ScheduleResponse> {
  sphinxLogger.info('=> Greenlight schedule')
  return new Promise((resolve, reject) => {
    try {
      const s = loadScheduler()
      s.schedule(
        {
          node_id: Buffer.from(pubkey, 'hex'),
        },
        (err, response) => {
          // console.log('=> schedule', err, response);
          if (!err && response) {
            GREENLIGHT_GRPC_URI = response.grpc_uri
            resolve(response)
          } else {
            reject(err)
          }
        }
      )
    } catch (e) {
      sphinxLogger.error(e)
    }
  })
}

async function recoverGreenlight(gid: GreenlightIdentity) {
  sphinxLogger.info('=> recoverGreenlight')
  try {
    const challenge = await get_challenge(gid.node_id)
    const signature = await sign_challenge(challenge)
    const res = await recover(gid.node_id, challenge, signature)
    const keyLoc = config.tls_key_location
    const chainLoc = config.tls_chain_location
    sphinxLogger.info(`RECOVER KEY ${keyLoc} ${res.device_key}`)
    fs.writeFileSync(keyLoc, res.device_key)
    fs.writeFileSync(chainLoc, res.device_cert)
    writeTlsLocation()
  } catch (e) {
    sphinxLogger.info(`Greenlight register error ${e}`)
  }
}

function writeTlsLocation() {
  const glCert = fs.readFileSync(config.scheduler_tls_location)
  if (glCert) {
    fs.writeFileSync(config.tls_location, glCert)
  }
}

async function registerGreenlight(
  gid: GreenlightIdentity,
  rootkey: string,
  secretPath: string
) {
  try {
    sphinxLogger.info('=> registerGreenlight')
    const challenge = await get_challenge(gid.node_id)
    const signature = await sign_challenge(challenge)
    const res = await register(
      gid.node_id,
      gid.bip32_key + gid.bolt12_key,
      challenge,
      signature
    )
    const keyLoc = config.tls_key_location
    const chainLoc = config.tls_chain_location
    sphinxLogger.info(`WRITE KEY ${keyLoc} ${res.device_key}`)
    fs.writeFileSync(keyLoc, res.device_key)
    fs.writeFileSync(chainLoc, res.device_cert)
    writeTlsLocation()
    // after registered successfully
    fs.writeFileSync(secretPath, Buffer.from(rootkey, 'hex'))
  } catch (e) {
    sphinxLogger.error(`Greenlight register error ${e}`)
  }
}

export function get_challenge(node_id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const s = loadScheduler()
      s.getChallenge(
        {
          node_id: Buffer.from(node_id, 'hex'),
          scope: 'REGISTER',
        },
        (err, response) => {
          if (!err && response) {
            resolve(Buffer.from(response.challenge).toString('hex'))
          } else {
            reject(err)
          }
        }
      )
    } catch (e) {
      reject(e)
    }
  })
}

export function sign_challenge(challenge: string): string {
  const pld = interfaces.greenlightSignMessagePayload(
    Buffer.from(challenge, 'hex')
  )
  const sig = libhsmd.Handle(1024, 0, null, pld)
  const sigBuf = Buffer.from(sig, 'hex')
  const sigBytes = sigBuf.subarray(2, 66)
  return sigBytes.toString('hex')
}

interface RegisterResponse {
  device_cert: string
  device_key: string
}
export function register(
  pubkey: string,
  bip32_key: string,
  challenge: string,
  signature: string
): Promise<RegisterResponse> {
  return new Promise((resolve, reject) => {
    try {
      const s = loadScheduler()
      s.register(
        {
          node_id: Buffer.from(pubkey, 'hex'),
          bip32_key: Buffer.from(bip32_key, 'hex'),
          network: 'bitcoin',
          challenge: Buffer.from(challenge, 'hex'),
          signature: Buffer.from(signature, 'hex'),
        },
        (err, response) => {
          sphinxLogger.info(`${err} ${response}`)
          if (!err && response) {
            resolve(response)
          } else {
            reject(err)
          }
        }
      )
    } catch (e) {
      reject(e)
    }
  })
}

export function recover(
  pubkey: string,
  challenge: string,
  signature: string
): Promise<RegisterResponse> {
  return new Promise((resolve, reject) => {
    try {
      const s = loadScheduler()
      s.recover(
        {
          node_id: Buffer.from(pubkey, 'hex'),
          challenge: Buffer.from(challenge, 'hex'),
          signature: Buffer.from(signature, 'hex'),
        },
        (err, response) => {
          sphinxLogger.info(`${err} ${response}`)
          if (!err && response) {
            resolve(response)
          } else {
            reject(err)
          }
        }
      )
    } catch (e) {
      reject(e)
    }
  })
}

interface HsmRequestContext {
  node_id: Buffer
  dbid: string // uint64
  capabilities: string // uint64
}
export interface HsmRequest {
  request_id: number
  context: HsmRequestContext
  raw: Buffer
}

export async function streamHsmRequests(): Promise<void> {
  const capabilities_bitset = 1087 // 1 + 2 + 4 + 8 + 16 + 32 + 1024
  try {
    const lightning = await loadLightning(true) // try proxy
    const call = (<NodeClient>lightning).streamHsmRequests({})
    call.on('data', async function (response) {
      sphinxLogger.info(`DATA ${response}`)
      try {
        let sig = ''
        if (response.context) {
          const dbid = parseInt(response.context.dbid)
          const peer = dbid ? response.context.node_id.toString('hex') : null
          sig = libhsmd.Handle(
            capabilities_bitset,
            dbid,
            peer,
            response.raw.toString('hex')
          )
        } else {
          sphinxLogger.info(`RAW ====== `)
          sphinxLogger.info(response.raw.toString('hex'))
          sig = libhsmd.Handle(
            capabilities_bitset,
            0,
            null,
            response.raw.toString('hex')
          )
        }
        ;(<NodeClient>lightning).respondHsmRequest(
          {
            request_id: response.request_id,
            raw: Buffer.from(sig, 'hex'),
          },
          (err, response) => {
            if (err) sphinxLogger.error(`[HSMD] error ${err}`)
            else sphinxLogger.info(`[HSMD] success ${response}`)
          }
        )
      } catch (e) {
        sphinxLogger.error(`[HSMD] failure ${e}`)
      }
    })
    call.on('status', function (status) {
      sphinxLogger.info(`[HSMD] Status ${status.code} ${status}`)
    })
    call.on('error', function (err) {
      sphinxLogger.error(`[HSMD] Error ${err.name} ${err.message}`)
    })
    call.on('end', function () {
      sphinxLogger.info(`[HSMD] Closed stream`)
    })
  } catch (e) {
    sphinxLogger.error(`[HSMD] last error: ${e}`)
  }
}
