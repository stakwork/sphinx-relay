import test from 'ava'
import nodes from '../nodes'
import { saveActionHistory } from '../utils/save'
import { verifyActionHistorySaved } from '../utils/get'

/*
npx ava src/tests/controllers/actionHistory.test.ts --verbose --serial --timeout=2m
*/

test('test boostPayment: create tribe, join tribe, send messages, boost messages, leave tribe, delete tribe', async (t) => {
  await actionHistory(t, 0)
})

export async function actionHistory(t, index) {
  let node = nodes[index]

  console.log(`Testing Action History for ${node.alias}`)

  const searchTerm = 'search for utxo'
  const saveAction = await saveActionHistory(t, searchTerm, node)
  t.true(saveAction, 'Action needs to be saved on the DB')

  const checkActionHistory = await verifyActionHistorySaved(searchTerm, node)
  t.true(checkActionHistory, 'Search term should be in the database')
}
