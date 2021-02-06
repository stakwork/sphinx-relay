var test = require('ava')
var http = require('ava-http')
var crypto = require('crypto')

const authToken = '4352c1b321c840cc0022d47a2d978d1207bc4ca9'
const url = 'http://localhost:3001/'

function makeArgs(node) {
  return {
    headers : {'x-user-token':node.authToken}
  }
}

test('getmsgs', async t=>{
  const r = await http.get(url+'messages', makeArgs({authToken}))
  console.log(r)
  t.truthy(r)
})

test.skip('init', async t=>{

  const token = crypto.randomBytes(20).toString('hex');
  const r = await http.post(url+'contacts/tokens', {
    body: {token}
  })
  t.truthy(r)
  
})


