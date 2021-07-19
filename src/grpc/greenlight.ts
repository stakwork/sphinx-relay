import * as fs from 'fs'
import * as grpc from 'grpc'
import * as libhsmd from 'libhsmd'
import { loadConfig } from '../utils/config'
import * as ByteBuffer from 'bytebuffer'
import * as crypto from 'crypto'
import * as interfaces from './interfaces'
import {loadLightning} from './lightning'

const config = loadConfig()

export async function initGreenlight() {
  await startGreenlightInit()
  // await streamHsmRequests()
}

var schedulerClient = <any>null;

const loadSchedulerCredentials = () => {
  var glCert = fs.readFileSync(config.scheduler_tls_location);
  var glPriv = fs.readFileSync(config.scheduler_key_location);
  var glChain = fs.readFileSync(config.scheduler_chain_location);
  return grpc.credentials.createSsl(glCert, glPriv, glChain);
};

export function loadScheduler() {
  // 35.236.110.178:2601
  var descriptor = grpc.load("proto/scheduler.proto");
  var scheduler: any = descriptor.scheduler;
  var options = {
    "grpc.ssl_target_name_override": "localhost",
  };
  schedulerClient = new scheduler.Scheduler(
    "35.236.110.178:2601",
    loadSchedulerCredentials(),
    options
  );
  return schedulerClient;
}

let GREENLIGHT_GRPC_URI = ''

export function get_greenlight_grpc_uri(): string {
  return GREENLIGHT_GRPC_URI
}

interface GreenlightIdentity {
  node_id: string;
  bip32_key: string;
  bolt12_key: string;
}
let GID: GreenlightIdentity;
export async function startGreenlightInit() {
  try {
    let needToRegister = false;
    const secretPath = config.hsm_secret_path
    let rootkey:string
    if (!fs.existsSync(secretPath)) {
      needToRegister = true;
      rootkey = crypto.randomBytes(32).toString("hex");
    } else {
      rootkey = fs.readFileSync(secretPath).toString()
    }
    const msgHex = libhsmd.Init(rootkey, "bitcoin");
    const msg = Buffer.from(msgHex, "hex");
    // console.log("INIT MSG LENGTH", msg.length)
    const node_id = msg.subarray(2, 35);
    const bip32_key = msg.subarray(35, msg.length - 32);
    const bolt12_key = msg.subarray(msg.length - 32, msg.length);
    GID = {
      node_id: node_id.toString("hex"),
      bip32_key: bip32_key.toString("hex"),
      bolt12_key: bolt12_key.toString("hex"),
    };
    if (needToRegister) {
      await registerGreenlight(GID, rootkey, secretPath);
    }
    const keyLoc = config.tls_key_location
    const noNeedToRecover = fs.existsSync(keyLoc)
    if(!noNeedToRecover) {
      await recoverGreenlight(GID)
    }
    const r = await schedule(GID.node_id)
    console.log(r.node_id.toString('hex'))
  } catch(e) {
    console.log('initGreenlight error', e)
  }
}

interface ScheduleResponse {
  node_id: Buffer,
  grpc_uri: string
}
export function schedule(pubkey: string): Promise<ScheduleResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const s = loadScheduler();
      s.schedule(
        {
          node_id: ByteBuffer.fromHex(pubkey),
        },
        (err, response) => {
          // console.log('=> schedule', err, response);
          if (!err) {
            GREENLIGHT_GRPC_URI = response.grpc_uri;
            resolve(response);
          } else {
            reject(err);
          }
        }
      );
    } catch (e) {
      console.log(e);
    }
  });
}

async function recoverGreenlight(gid: GreenlightIdentity) {
  try {
    const challenge = await get_challenge(gid.node_id);
    const signature = await sign_challenge(challenge)
    const res = await recover(
      gid.node_id, 
      challenge,
      signature
    )
    const keyLoc = config.tls_key_location
    const chainLoc = config.tls_chain_location
    console.log("RECOVER KEY", keyLoc, res.device_key)
    fs.writeFileSync(keyLoc, res.device_key)
    fs.writeFileSync(chainLoc, res.device_cert)
    writeTlsLocation()
  } catch(e) {
    console.log('Greenlight register error', e)
  }
}

function writeTlsLocation() {
  var glCert = fs.readFileSync(config.scheduler_tls_location);
  if(glCert) {
    fs.writeFileSync(config.tls_location, glCert)
  }
}

async function registerGreenlight(gid: GreenlightIdentity, rootkey: string, secretPath: string) {
  try {
    const challenge = await get_challenge(gid.node_id);
    const signature = await sign_challenge(challenge)
    const res = await register(
      gid.node_id, 
      gid.bip32_key + gid.bolt12_key,
      challenge,
      signature
    )
    const keyLoc = config.tls_key_location
    const chainLoc = config.tls_chain_location
    console.log("WRITE KEY", keyLoc, res.device_key)
    fs.writeFileSync(keyLoc, res.device_key)
    fs.writeFileSync(chainLoc, res.device_cert)
    writeTlsLocation()
    // after registered successfully
    fs.writeFileSync(secretPath, rootkey);
  } catch(e) {
    console.log('Greenlight register error', e)
  }
}

export function get_challenge(node_id: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const s = loadScheduler();
      s.getChallenge(
        {
          node_id: ByteBuffer.fromHex(node_id),
          scope: 'REGISTER',
        },
        (err, response) => {
          if (!err) {
            resolve(
              Buffer.from(response.challenge).toString('hex')
            );
          } else {
            reject(err);
          }
        }
      )
    } catch(e) {
      reject(e);
    }
  })
}

export function sign_challenge(challenge: string): string {
  const pld = interfaces.greenlightSignMessagePayload(Buffer.from(challenge, 'hex'))
  const sig = libhsmd.Handle(1024, 0, null, pld)
  const sigBuf = Buffer.from(sig, 'hex')
  const sigBytes = sigBuf.subarray(2, 66)
  return sigBytes.toString('hex')
}

interface RegisterResponse {
  device_cert: string
  device_key: string
}
export function register(pubkey: string, bip32_key: string, challenge: string, signature: string): Promise<RegisterResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const s = loadScheduler();
      s.register(
        {
          node_id: ByteBuffer.fromHex(pubkey),
          bip32_key: ByteBuffer.fromHex(bip32_key),
          network: "bitcoin",
          challenge: ByteBuffer.fromHex(challenge),
          signature: ByteBuffer.fromHex(signature),
        },
        (err, response) => {
          console.log(err, response);
          if (!err) {
            resolve(response);
          } else {
            reject(err);
          }
        }
      );
    } catch (e) {
      reject(e)
    }
  });
}

export function recover(pubkey: string, challenge: string, signature: string): Promise<RegisterResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const s = loadScheduler();
      s.recover(
        {
          node_id: ByteBuffer.fromHex(pubkey),
          challenge: ByteBuffer.fromHex(challenge),
          signature: ByteBuffer.fromHex(signature),
        },
        (err, response) => {
          console.log(err, response);
          if (!err) {
            resolve(response);
          } else {
            reject(err);
          }
        }
      );
    } catch (e) {
      reject(e)
    }
  });
}

interface HsmRequestContext {
  node_id: Buffer,
	dbid: string, // uint64
	capabilities: string, // uint64
}
export interface HsmRequest {
  request_id: number,
	context: HsmRequestContext,
	raw: Buffer,
}
interface HsmResponse {
  request_id: number
	raw: ByteBuffer
}
export async function streamHsmRequests() {
  const capabilities_bitset = 1087 // 1 + 2 + 4 + 8 + 16 + 32 + 1024
  try {
    const lightning = await loadLightning(true) // try proxy
		var call = lightning.streamHsmRequests({})
		call.on('data', async function (response) {
      console.log("DATA", response)
      try {
        let sig = ''
        if (response.context) {
          const dbid = parseInt(response.context.dbid)
          const peer = response.context.node_id.toString('hex')
          sig = libhsmd.Handle(capabilities_bitset, peer, dbid, response.raw.toString('hex'))
        } else {
          sig = libhsmd.Handle(capabilities_bitset, 0, null, response.raw.toString('hex'))
        }
        lightning.respondHsmRequest(<HsmResponse>{
          request_id: response.request_id,
          raw: ByteBuffer.fromHex(sig)
        }, (err, response) => {
          if(err) console.log('[HSMD] error', err)
          else console.log("[HSMD] success", response)
        })
      } catch(e) {
        console.log("[HSMD] failure", e)
      }
		});
		call.on('status', function (status) {
			console.log("[HSMD] Status", status.code, status);			
		})
		call.on('error', function (err) {
			console.error('[HSMD] Error', err.code)
		})
		call.on('end', function () {
			console.log(`[HSMD] Closed stream`);
		})
  } catch(e) {
    console.log('[HSMD] last error:', e)
  }
}