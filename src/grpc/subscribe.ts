import {loadLightning} from './lightning'
import * as network from '../network'
import {tryToUnlockLND} from '../utils/unlock'
import {receiveNonKeysend} from './regular'
import * as interfaces from './interfaces'
import {isProxy, getProxyRootPubkey} from '../utils/proxy'
import {sphinxLogger, logging} from '../utils/logger'
import {loadConfig} from '../utils/config'
import {sleep} from '../helpers'
import {number} from 'yup'
import {resolve} from 'path'

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
  while (true) {
    // pull the last invoice, and run "parseKeysendInvoice"
    // increment the lastpay_index (+1)
    // wait a second and do it again with new lastpay_index

    // Get the last invoice length
    const lastpay_index = await getInvoicesLength(lightning);
    // console.log('LAST PAY INDEx', lastpay_index);

    lightning[cmd]({lastpay_index}, function (err, response) {
      if (err == null) {

        if (response.description.includes('keysend')) {
          // console.log('Invoice Response ===', JSON.stringify(response));

          // const inv = interfaces.subscribeResponse(response)
        }

      } else {
        console.log(err)
      }
    })

    await sleep(1000)
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

