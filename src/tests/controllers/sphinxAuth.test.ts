import test, { ExecutionContext } from 'ava'
import * as http from 'ava-http'
import { config } from '../config'
import nodes from '../nodes'
import { makeArgs, asyncForEach } from '../utils/helpers'

/*
npx ava src/tests/controllers/sphinxAuth.test.ts --verbose --serial --timeout=2m
*/

interface Context {}

test.serial(
  'sphinxAuth: Testing Sphinx Auth',
  async (t: ExecutionContext<Context>) => {
    await asyncForEach(nodes, async (node) => {
      await sphinxAuth(t, node)
    })
  }
)

async function sphinxAuth(t, node) {
  console.log(`${node.alias} is starting sphinx auth`)

  //GET CHALLENGE FROM Auth Server
  const ask = await http.get('http://' + config.authHost + '/ask')
  const challenge = ask.challenge
  t.true(typeof challenge === 'string', 'should return challenge string')

  //Node signs the Challenge Passed
  const signer = await http.get(
    `${node.external_ip}/signer/${challenge}`,
    makeArgs(node)
  )
  const sig = signer.response.sig
  t.true(typeof sig === 'string', 'Signer route should return a sig')

  //Verify Signature from Auth server
  const verify = await http.post(`http://${config.authHost}/verify`, {
    form: { id: ask.id, sig: sig, pubkey: node.pubkey },
  })
  const token = verify.token
  t.true(
    typeof token === 'string',
    'Verify route on auth server should return a token'
  )

  console.log(`${node.alias} finished sphinx auth`)
}
