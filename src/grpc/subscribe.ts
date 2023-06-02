import { loadLightning, SPHINX_CUSTOM_RECORD_KEY } from './lightning'
import * as network from '../network'
import { tryToUnlockLND } from '../utils/unlock'
import { receiveNonKeysend } from './regular'
import * as interfaces from './interfaces'
import { isProxy, getProxyRootPubkey } from '../utils/proxy'
import { sphinxLogger, logging } from '../utils/logger'

const ERR_CODE_UNAVAILABLE = 14
const ERR_CODE_STREAM_REMOVED = 2
const ERR_CODE_UNIMPLEMENTED = 12 // locked

export function subscribeInvoices(
  parseKeysendInvoice: (i: interfaces.Invoice) => Promise<void>
): Promise<void | null> {
  return new Promise(async (resolve, reject) => {
    let ownerPubkey = ''
    if (isProxy()) {
      ownerPubkey = await getProxyRootPubkey()
    }
    const lightning = await loadLightning(true, ownerPubkey) // try proxy

    const cmd = interfaces.subscribeCommand()
    const call = lightning[cmd]({})
    call.on('data', async function (response) {
      // console.log('=> INVOICE RAW', response)
      const inv = interfaces.subscribeResponse(response)
      // console.log("INVOICE RECEIVED", inv)
      // loginvoice(inv)
      if (inv.state !== interfaces.InvoiceState.SETTLED) {
        return
      }
      // console.log("IS KEYSEND", inv.is_keysend)
      if (
        (inv.htlcs &&
          inv.htlcs[0] &&
          inv.htlcs[0].custom_records &&
          SPHINX_CUSTOM_RECORD_KEY in inv.htlcs[0].custom_records) ||
        inv.is_keysend
      ) {
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
    await network.initGrpcSubscriptions()
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
