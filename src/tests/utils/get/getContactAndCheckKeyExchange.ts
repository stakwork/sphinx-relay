import { getContacts } from './getContacts'
import { Assertions } from 'ava'
import { Contact, NodeConfig } from '../../types'

export function getContactAndCheckKeyExchange(
  t: Assertions,
  node1: NodeConfig,
  node2: NodeConfig
): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      timeout(1, t, node1, node2, resolve, reject)
    }, 1000)
  })
}

async function timeout(i, t, node1, node2, resolve, reject) {
  const [node1contact, node2contact] = await getContacts(t, node1, node2)
  if (node1contact.contact_key && node2contact.contact_key) {
    return resolve([node1contact, node2contact])
  }
  if (i >= 15) {
    return reject('failed to getContactAndCheckKeyExchange')
  }
  setTimeout(() => {
    timeout(i + 1, t, node1, node2, resolve, reject)
  }, 1000)
}
