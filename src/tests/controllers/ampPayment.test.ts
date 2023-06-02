import test, { ExecutionContext } from 'ava'
import { sendPayment } from '../utils/msg'
import nodes from '../nodes'
import { addContact } from '../utils/save'
import { NodeConfig } from '../types'

/*
 npx ava src/tests/controllers/ampPayment.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'ampMessage: send more sats than one channel can handle to test AMP',
  async (t: ExecutionContext<Context>) => {
    t.true(Array.isArray(nodes))
    await ampMessage(t, nodes)
  }
)

async function ampMessage(t: ExecutionContext<Context>, nodes: NodeConfig[]) {
  // node  accept-keysend  accept-amp
  // alice      true          true
  // bob        false         true
  // carol      true          false

  // the 3 nodes have 3 2M channels in total with 1M sats local_balance
  //
  //         A
  //     1M / \ 1M
  //       /   \
  //      /     \
  //  1M /       \ 1M
  //    B---------C
  //     1M     1M
  //

  // Test that alice can send a payment of 1.5M sats to bob
  // With only keysend this would not work because she has 2x 1M local_balance
  // The payment should be split in 2 shards of 750k sats each
  //      --- shard of 750k sats ---> C --- forward --->
  //   A                                                  B
  //      --------- second shard of 750k sats --------->

  {
    const node1 = nodes[0]
    const node2 = nodes[1]

    console.log(`amp payment from ${node1.alias} to ${node2.alias}`)

    console.log('adding contact')
    const added = await addContact(t, node1, node2)
    t.true(added, 'n1 should add n2 as contact')
    console.log('contact added')

    console.log(`sending payment ${node1.alias} -> ${node2.alias}`)
    //NODE1 SENDS PAYMENT TO NODE2
    const amount = 1500000
    const paymentText = 'AMP test 1'
    const payment = await sendPayment(t, node1, node2, amount, paymentText)
    console.log(payment)
    t.true(payment, 'payment should be sent')
    console.log(`payment sent ${node1.alias} -> ${node2.alias}`)
  }

  // Nodes will try to send AMP, but carol doesn't `accept-amp`
  // Test a payment of 100k sats from bob to carol

  {
    const node1 = nodes[1]
    const node2 = nodes[2]

    console.log(`amp payment from ${node1.alias} to ${node2.alias}`)

    console.log('adding contact')
    const added = await addContact(t, node1, node2)
    t.true(added, 'n1 should add n2 as contact')
    console.log('contact added')

    console.log(`sending payment ${node1.alias} -> ${node2.alias}`)
    //NODE1 SENDS PAYMENT TO NODE2
    const amount = 100000
    const paymentText = 'AMP test 2'
    const payment = await sendPayment(t, node1, node2, amount, paymentText)
    console.log(payment)
    t.true(payment, 'payment should be sent')
    console.log(`payment sent ${node1.alias} -> ${node2.alias}`)
  }

  // Carol doesn't `accept-amp`, but that doesn't mean he can't send it
  // Test a payment of 1.8M sats from carol to alice

  {
    const node1 = nodes[2]
    const node2 = nodes[0]

    console.log(`amp payment from ${node1.alias} to ${node2.alias}`)

    console.log('adding contact')
    const added = await addContact(t, node1, node2)
    t.true(added, 'n1 should add n2 as contact')
    console.log('contact added')

    console.log(`sending payment ${node1.alias} -> ${node2.alias}`)
    //NODE1 SENDS PAYMENT TO NODE2
    const amount = 1800000
    const paymentText = 'AMP test 3'
    const payment = await sendPayment(t, node1, node2, amount, paymentText)
    console.log(payment)
    t.true(payment, 'payment should be sent')
    console.log(`payment sent ${node1.alias} -> ${node2.alias}`)
  }
}

module.exports = ampMessage
