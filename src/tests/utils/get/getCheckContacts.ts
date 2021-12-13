import { getContacts } from '../get'
import { NodeConfig } from '../../types'

export function getCheckContacts(t, node1, node2): Promise<Array<any>> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      timeout(0, t, node1, node2, resolve, reject)
    }, 1000)
  })
}

async function timeout(
  i: number,
  t,
  node1: NodeConfig,
  node2: NodeConfig,
  resolve,
  reject
) {
  const [node1contact, node2contact] = await getContacts(t, node1, node2)
  if (node1contact.contact_key && node2contact.contact_key) {
    return resolve([node1contact, node2contact])
  }
  if (i > 10) {
    return reject('failed to getCheckContacts')
  }
  setTimeout(async () => {
    timeout(i + 1, t, node1, node2, resolve, reject)
  }, 1000)
}
