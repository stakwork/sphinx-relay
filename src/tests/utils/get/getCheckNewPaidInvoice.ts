import { Assertions } from 'ava'
import http = require('ava-http')
import { NodeConfig } from '../../types'
import { makeArgs } from '../helpers'

export const getCheckNewPaidInvoice = async (
  _t: Assertions,
  node: NodeConfig,
  paymentHash: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      timeout(0, node, paymentHash, resolve, reject)
    }, 1000)
  })
}

async function timeout(i, node, paymentHash, resolve, reject) {
  const msgRes = await http.get(node.external_ip + '/messages', makeArgs(node))
  if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
    const paidInvoice = msgRes.response.new_messages.find(
      (msg) => msg.type === 3 && msg.payment_hash === paymentHash
    )
    if (paidInvoice) {
      return resolve(paidInvoice)
    }
  }
  if (i > 10) {
    return reject(['failed to getCheckNewPaidInvoice'])
  }
  setTimeout(() => {
    timeout(i + 1, node, paymentHash, resolve, reject)
  }, 1000)
}
