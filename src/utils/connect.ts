import * as publicIp from 'public-ip'
import password from './password'
import * as LND from './lightning'
import { isClean } from './nodeinfo'
import {loadConfig} from './config'
import { get_hub_pubkey } from '../controllers/queries'
const fs = require('fs')

const config = loadConfig()

export async function getQR():Promise<string> {
  let theIP

  const public_url = config.public_url
  if (public_url) theIP = public_url

  if (!theIP) {
    const ip = process.env.NODE_IP
    if (!ip) {
      try {
        theIP = await publicIp.v4()
      } catch (e) { }
    } else {
      // const port = config.node_http_port
      // theIP = port ? `${ip}:${port}` : ip
      theIP = ip
    }
  }
  return Buffer.from(`ip::${theIP}::${password || ''}`).toString('base64')
}

async function makeVarScript(): Promise<string> {

  const clean = await isClean()
  const isSignedUp = clean ? false : true

  const channelList = await LND.listChannels({});
  const { channels } = channelList;
  if (!channels || channels.length===0) {
    return `<script>
  window.channelIsOpen=false;
  window.channelFeesBaseZero=false;
  window.hasRemoteBalance=false;
  window.isSignedUp=${isSignedUp};
</script>`
  }

  const remoteBalances = channels.map((c) => c.remote_balance);
  const totalRemoteBalance = remoteBalances.reduce(
    (a, b) => parseInt(a) + parseInt(b),
    0
  );

  const hasRemoteBalance = totalRemoteBalance > 0 ? true : false

  let channelFeesBaseZero = false
  const policies = ['node1_policy','node2_policy']
  await asyncForEach(channels, async chan=>{
    const info = await LND.getChanInfo(chan.chan_id)
    if(!info) return
    policies.forEach(p=>{
      if(info[p]) {
        const fee_base_msat = parseInt(info[p].fee_base_msat)
        if(fee_base_msat===0) {
          channelFeesBaseZero = true
        }
      }
    })
  })
  return `<script>
  window.channelIsOpen=true;
  window.channelFeesBaseZero=${channelFeesBaseZero};
  window.hasRemoteBalance=${hasRemoteBalance};
  window.isSignedUp=${isSignedUp};
</script>`
}

export async function connect(req, res) {
  fs.readFile("public/index.html", async function (error, pgResp) {
    if (error) {
      res.writeHead(404);
      res.write('Contents you are looking are Not Found');
    } else {
      const newScript = await makeVarScript()
      const hub_pubkey = await get_hub_pubkey()
      const htmlString = Buffer.from(pgResp).toString()
      const qr = await getQR()
      const rep = htmlString.replace(/CONNECTION_STRING/g, qr)
      const rep2 = rep.replace("<script>var hi='hello';</script>", newScript)
      const rep3 = rep2.replace(/SPHINX_HUB_PUBKEY/g, hub_pubkey)
      const final = Buffer.from(rep3, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(final);
    }
    res.end();
  });
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}