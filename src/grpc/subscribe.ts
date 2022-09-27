import {loadLightning} from './lightning'
import * as network from '../network'
import {tryToUnlockLND} from '../utils/unlock'
import {receiveNonKeysend} from './regular'
import * as interfaces from './interfaces'
import {isProxy, getProxyRootPubkey} from '../utils/proxy'
import {sphinxLogger, logging} from '../utils/logger'
import {loadConfig} from '../utils/config'
import {sleep} from '../helpers'

const config = loadConfig()

const IS_CLN = config.lightning_provider === 'CLN'

const ERR_CODE_UNAVAILABLE = 14
const ERR_CODE_STREAM_REMOVED = 2
const ERR_CODE_UNIMPLEMENTED = 12 // locked

export function subscribeInvoices(
  parseKeysendInvoice: (i: interfaces.Invoice) => Promise<void>
): Promise<void | null> {
  return new Promise(async (resolve, reject) => {
    let ownerPubkey = '';

    if (isProxy()) {
      ownerPubkey = await getProxyRootPubkey()
    }

    const lightning = await loadLightning(false, ownerPubkey) // try proxy


    const cmd = interfaces.subscribeCommand()

    if (IS_CLN) {
      return subscribeCLN(cmd, lightning)
    }

    const call = lightning[cmd]()

    call.on('data', async function (response) {
      // console.log("=> INVOICE RAW", response)
      const inv = interfaces.subscribeResponse(response)
      // console.log("INVOICE RECEIVED", inv)
      // loginvoice(inv)
      if (inv.state !== interfaces.InvoiceState.SETTLED) {
        return
      }
      // console.log("IS KEYSEND", inv.is_keysend)
      if (inv.is_keysend) {
        parseKeysendInvoice(inv)
      } else {
        receiveNonKeysend(inv)
      }
    })

    call.on('status', function (status) {
      sphinxLogger.info(`Status ${status.code} ${status}`, logging.Lightning)
      // The server is unavailable, trying to reconnect.
      if (
        status.code == ERR_CODE_UNAVAILABLE ||
        status.code == ERR_CODE_STREAM_REMOVED
      ) {
        i = 0
        waitAndReconnect()
      } else {
        resolve(status)
      }
    })
    call.on('error', function (err) {
      sphinxLogger.error(`Error ${err.code}`, logging.Lightning)
      if (
        err.code == ERR_CODE_UNAVAILABLE ||
        err.code == ERR_CODE_STREAM_REMOVED
      ) {
        i = 0
        waitAndReconnect()
      } else {
        reject(err)
      }
    })
    call.on('end', function () {
      sphinxLogger.info(`Closed stream`, logging.Lightning)
      // The server has closed the stream.
      i = 0
      waitAndReconnect()
    })
    setTimeout(() => {
      resolve(null)
    }, 100)
  })
}

function waitAndReconnect() {
  setTimeout(() => reconnectToLightning(Math.random(), null, true), 2000)
}

let i = 0
let ctx = 0
export async function reconnectToLightning(
  innerCtx: number,
  callback?: (() => Promise<void>) | null,
  noCache?: boolean
): Promise<void> {
  ctx = innerCtx
  i++
  sphinxLogger.info(`reconnecting... attempt #${i}`, logging.Lightning)
  try {
    await network.initGrpcSubscriptions(true)
    sphinxLogger.info(`connected!`, logging.Lightning)
    if (callback) callback()
  } catch (e) {
    if (e.code === ERR_CODE_UNIMPLEMENTED) {
      sphinxLogger.error(`LOCKED`, logging.Lightning)
      await tryToUnlockLND()
    }
    sphinxLogger.error(`ERROR ${e}`, logging.Lightning)
    setTimeout(async () => {
      // retry each 2 secs
      if (ctx === innerCtx) {
        // if another retry fires, then this will not run
        await reconnectToLightning(innerCtx, callback, noCache)
      }
    }, 5000)
  }
}

export async function subscribeCLN(cmd: string, lightning: any): Promise<void | null> {
  let lastpay_index = await getInvoicesLength(lightning);
  while (true) {
  //   // pull the last invoice, and run "parseKeysendInvoice"
  //   // increment the lastpay_index (+1)
  //   // wait a second and do it again with new lastpay_index

  //   // Get the last invoice length
  //   // console.log('LAST PAY INDEx', lastpay_index);

    lightning[cmd]({lastpay_index}, function (err, response) {
      if (err == null) {

        if (response.description.includes('keysend')) {
          
          
          const invoice = convertToLndInvoice(response);

          // console.log('Invoice Response ===', invoice);
          
          // const inv = interfaces.subscribeResponse(invoice)
          lastpay_index += 1;
        }

      } else {
        console.log(err)
      }
    })

    await sleep(1000)
  }
}

const convertToLndInvoice = (response: {[key: string]: any}): interfaces.Invoice => {
  return {
    memo: response.label,
    r_preimage: response.payment_preimage,
    r_hash: response.payment_hash,
    value: response.amount,
    value_msat: response.amount_msat,
    settled: response.status === 'paid' ? true : false,
    creation_date: '',
    settle_date: response.paid_at,
    payment_request: response.bolt11,
    description_hash: Buffer.from(''),
    expiry: response.expires_at,
    fallback_addr: '',
    cltv_expiry: '',
    route_hints: [],
    private: false,
    add_index: '',
    settle_index: response.pay_index,
    amt_paid: String(response.amount_received_msat.msat / 1000),
    amt_paid_sat: String(response.amount_received_msat.msat / 1000),
    amt_paid_msat: response.amount_received_msat.msat,
    state: response.status,
    htlcs: [],
    features: {},
    is_keysend: response.description.includes('keysend')
  }
}

const getInvoicesLength = (lightning: any): Promise<number> => {
  return new Promise((resolve, reject) => {
    lightning['ListInvoices']({}, function (err, response) {
      if (err === null) {
        resolve(response.invoices.length)
      }
      reject(1);
    });
  })
}

