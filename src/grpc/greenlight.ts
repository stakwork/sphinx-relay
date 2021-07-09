import * as fs from 'fs'
import * as grpc from 'grpc'
import * as libhsmd from 'libhsmd'
import { loadConfig } from '../utils/config'
import * as ByteBuffer from 'bytebuffer'
import * as crypto from 'crypto'
import * as interfaces from './interfaces'

const config = loadConfig()

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
export async function initGreenlight() {
  try {
    let needToRegister = false;
    const secretPath = config.hsm_secret_path || "./hsm_secret";
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
    await schedule(GID.node_id)
  } catch(e) {
    console.log('initGreenlight error', e)
  }
}

export function schedule(pubkey: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const s = loadScheduler();
      s.schedule(
        {
          node_id: ByteBuffer.fromHex(pubkey),
        },
        (err, response) => {
          console.log('=> schedule', err, response);
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
    const keyLoc = config.tls_key_location || "./device-key.pem";
    const chainLoc = config.tls_chain_location || './device.crt'
    console.log("WITE KEY", keyLoc, res.device_key)
    fs.writeFileSync(keyLoc, res.device_key)
    fs.writeFileSync(chainLoc, res.device_cert)
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