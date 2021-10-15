import test, { ExecutionContext } from 'ava'
import nodes from '../nodes'
import { addContact } from '../utils/save'
import { randomText, iterate } from '../utils/helpers'
import { sendMessageAndCheckDecryption } from '../utils/msg'
import { NodeConfig } from '../types'
import { config } from '../config'

/*
npx ava src/tests/controllers/contacts.test.ts --verbose --serial --timeout=2m
*/
/*
sqlite3 /Users/evanfeenstra/code/sphinx/sphinx-stack/relay/db/bob.db
*/

interface Context {}

for (let i = 0; i < nodes.length; i++) {
	for (let j = 0; j < nodes.length; j++) {

        test.serial(`checkContacts for ${nodes[i].alias} to ${nodes[j].alias}`, async (t: ExecutionContext<Context>) => {
          t.true(Array.isArray(nodes))
          if (config.iterate) {
            await iterate(nodes, async (node1, node2) => {
              await checkContact(t, node1, node2)
            })
          } else {
            await checkContact(t, nodes[i], nodes[j])
          }
        })
    }
}

async function checkContact(
  t: ExecutionContext<Context>,
  node1: NodeConfig,
  node2: NodeConfig
) {
  console.log(`=> checkContact ${node1.alias} -> ${node2.alias}`)
  // NODE1 ADDS NODE2 AS A CONTACT
  // contact_key should be populated via key exchange in a few seconds
  let added = await addContact(t, node1, node2)
  t.true(added, 'node1 should add node2 as contact')
  console.log('added contact!')

  const text = randomText()
  let messageSent = await sendMessageAndCheckDecryption(t, node1, node2, text)
  t.truthy(messageSent, 'node1 should send text message to node2')
  console.log('sent message!')
}
