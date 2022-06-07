import http = require('ava-http')
import { makeArgs } from '../../utils/helpers'
import { encrypt } from '../../electronjs/rsa'
import { getCheckContacts } from '../get'

export async function sendInvoice(t, node1, node2, amount, text) {
  //SEND INVOICE FROM NODE1 TO NODE2 ===>

  const [node1contact, node2contact] = await getCheckContacts(t, node1, node2)
  //encrypt random string with node1 contact_key
  const encryptedText = encrypt(node1contact.contact_key, text)
  //encrypt random string with node2 contact_key
  const remoteText = encrypt(node2contact.contact_key, text)

  //create node2 contact id
  const contact_id = node2contact.id
  const destination_key = ''

  //create payment object
  const v = {
    contact_id: contact_id || null,
    chat_id: null,
    amount: amount,
    destination_key,
    text: encryptedText,
    remote_text: remoteText,
  }

  //post payment from node1 to node2
  const r = await http.post(node1.external_ip + '/invoices', makeArgs(node1, v))
  t.true(r.success, 'invoice should have been posted')

  return r
}
