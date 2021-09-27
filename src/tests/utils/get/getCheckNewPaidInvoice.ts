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
    let i = 0
    const interval = setInterval(async () => {
      i++
      const msgRes = await http.get(
        node.external_ip + '/messages',
        makeArgs(node)
      )
      if (msgRes.response.new_messages && msgRes.response.new_messages.length) {
        const paidInvoice = msgRes.response.new_messages.find(
          (msg) => msg.type === 3 && msg.payment_hash === paymentHash
        )
        if (paidInvoice) {
          clearInterval(interval)
          resolve(paidInvoice)
        }
      }
      if (i > 10) {
        clearInterval(interval)
        reject(['failed to getCheckNewPaidMsgs'])
      }
    }, 1000)
  })
}
