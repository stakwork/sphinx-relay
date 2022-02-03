import { loadLightning } from './lightning'
import * as network from '../network'
import * as moment from 'moment'
import { tryToUnlockLND } from '../utils/unlock'
import { receiveNonKeysend } from './regular'
import * as interfaces from './interfaces'
import { isProxy, getProxyRootPubkey } from '../utils/proxy'
import { sphinxLogger } from '../utils/logger'

const ERR_CODE_UNAVAILABLE = 14
const ERR_CODE_STREAM_REMOVED = 2
const ERR_CODE_UNIMPLEMENTED = 12 // locked

export function subscribeInvoices(parseKeysendInvoice) {
  return new Promise(async (resolve, reject) => {
    let ownerPubkey: string = ''
    if (isProxy()) {
      ownerPubkey = await getProxyRootPubkey()
    }
    const lightning = await loadLightning(true, ownerPubkey) // try proxy

    const cmd = interfaces.subscribeCommand()
    var call = lightning[cmd]()
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
      sphinxLogger.info(`[lightning] Status ${status.code} ${status}`)
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
      const now = moment().format('YYYY-MM-DD HH:mm:ss').trim()
      sphinxLogger.error(`[lightning] Error ${now} ${err.code}`)
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
      const now = moment().format('YYYY-MM-DD HH:mm:ss').trim()
      sphinxLogger.info(`[lightning] Closed stream ${now}`)
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

var i = 0
var ctx = 0
export async function reconnectToLightning(
  innerCtx: number,
  callback?: Function | null,
  noCache?: boolean
) {
  ctx = innerCtx
  i++
  const now = moment().format('YYYY-MM-DD HH:mm:ss').trim()
  sphinxLogger.info(`=> ${now} [lightning] reconnecting... attempt #${i}`)
  try {
    await network.initGrpcSubscriptions(true)
    const now = moment().format('YYYY-MM-DD HH:mm:ss').trim()
    sphinxLogger.info(`=> [lightning] connected! ${now}`)
    if (callback) callback()
  } catch (e) {
    if (e.code === ERR_CODE_UNIMPLEMENTED) {
      sphinxLogger.error(`[lightning] LOCKED ${now}`)
      await tryToUnlockLND()
    }
    sphinxLogger.error(`[lightning] ERROR ${e}`)
    setTimeout(async () => {
      // retry each 2 secs
      if (ctx === innerCtx) {
        // if another retry fires, then this will not run
        await reconnectToLightning(innerCtx, callback, noCache)
      }
    }, 5000)
  }
}
