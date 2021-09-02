import * as publicIp from 'public-ip'
import * as localip from 'ip'
import password from './password'
import * as Lightning from '../grpc/lightning'
import { isClean } from './nodeinfo'
import { loadConfig } from './config'
import { get_hub_pubkey, getSuggestedSatPerByte } from '../controllers/queries'
import { failure, success } from './res'
const fs = require('fs')
const net = require('net')

const config = loadConfig()
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT'

export async function getQR(): Promise<string> {
  let theIP

  const public_url = config.public_url
  if (public_url) theIP = public_url

  if (!theIP) {
    theIP = process.env.NODE_IP
    if (!theIP) {
      try {
        if (IS_GREENLIGHT) {
          theIP = localip.address()
        } else {
          theIP = await publicIp.v4()
        }
      } catch (e) {}
    }
    const isIP = net.isIP(theIP)
    if (isIP) {
      // add port if its an IP address
      const port = config.node_http_port
      theIP = port ? `${theIP}:${port}` : theIP
    }
  }
  if (!theIP.includes('://')) {
    // no protocol
    if (config.node_http_protocol) {
      theIP = `${config.node_http_protocol}://${theIP}`
    }
  }
  return Buffer.from(`ip::${theIP}::${password || ''}`).toString('base64')
}

async function makeVarScript(): Promise<string> {
  const clean = await isClean()
  const isSignedUp = clean ? false : true

  const channelList = await Lightning.listChannels({})
  const { channels } = channelList
  if (!channels || channels.length === 0) {
    return `<script>
  window.channelIsOpen=false;
  window.channelFeesBaseZero=false;
  window.hasRemoteBalance=false;
  window.isSignedUp=${isSignedUp};
</script>`
  }

  const remoteBalances = channels.map((c) => parseInt(c.remote_balance))
  const totalRemoteBalance = remoteBalances.reduce((a, b) => a + b, 0)

  const hasRemoteBalance = totalRemoteBalance > 0 ? true : false

  let channelFeesBaseZero = false
  const policies = ['node1_policy', 'node2_policy']
  await asyncForEach(channels, async (chan) => {
    const info = await Lightning.getChanInfo(chan.chan_id)
    if (!info) return
    policies.forEach((p) => {
      if (info[p]) {
        const fee_base_msat = parseInt(info[p].fee_base_msat)
        if (fee_base_msat === 0) {
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

export async function checkPeered(req, res) {
  const default_pubkey =
    '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f'
  const pubkey = req.body.pubkey || default_pubkey
  try {
    let peered = false
    let active = false
    let channel_point = ''
    const peers = await Lightning.listPeers()
    peers.peers.forEach((p) => {
      if (p.pub_key === pubkey) peered = true
    })
    const chans = await Lightning.listChannels()
    chans.channels.forEach((ch) => {
      if (ch.remote_pubkey === pubkey) {
        if (ch.active) active = true
        else channel_point = ch.channel_point
      }
    })
    success(res, { peered, active, channel_point })
  } catch (e) {
    console.log('=> checkPeered failed', e)
    failure(res, e)
  }
}

export async function connectPeer(req, res) {
  try {
    await Lightning.connectPeer({
      addr: {
        pubkey:
          '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f',
        host: '54.159.193.149:9735',
      },
    })
    success(res, 'ok')
  } catch (e) {
    console.log('=> connect peer failed', e)
    failure(res, e)
  }
}

export async function genChannel(req, res) {
  const { amount } = req.body
  if (!amount) return failure(res, 'no amount')
  try {
    await Lightning.connectPeer({
      addr: {
        pubkey:
          '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f',
        host: '54.159.193.149:9735',
      },
    })
    const sat_per_byte = await getSuggestedSatPerByte()
    await Lightning.openChannel({
      node_pubkey:
        '023d70f2f76d283c6c4e58109ee3a2816eb9d8feb40b23d62469060a2b2867b77f', // bytes
      local_funding_amount: amount,
      push_sat: Math.round(amount * 0.02),
      sat_per_byte,
    })
    success(res, 'ok')
  } catch (e) {
    console.log('=> connect failed', e)
  }
}

function greenlightConnect(req, res) {
  fs.readFile('public/index_greenlight.html', async function (error, pgResp) {
    if (error) {
      res.writeHead(404)
      res.write('Contents you are looking are Not Found')
    } else {
      const htmlString = Buffer.from(pgResp).toString()
      const qr = await getQR()
      const rep = htmlString.replace(/CONNECTION_STRING/g, qr)
      const final = Buffer.from(rep, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.write(final)
    }
    res.end()
  })
}
export async function connect(req, res) {
  if (IS_GREENLIGHT) return greenlightConnect(req, res)
  fs.readFile('public/index.html', async function (error, pgResp) {
    if (error) {
      res.writeHead(404)
      res.write('Contents you are looking are Not Found')
    } else {
      const newScript = await makeVarScript()
      const hub_pubkey = await get_hub_pubkey()
      const htmlString = Buffer.from(pgResp).toString()
      const qr = await getQR()
      const rep = htmlString.replace(/CONNECTION_STRING/g, qr)
      const rep2 = rep.replace("<script>var hi='hello';</script>", newScript)
      const rep3 = rep2.replace(/SPHINX_HUB_PUBKEY/g, hub_pubkey)
      const final = Buffer.from(rep3, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.write(final)
    }
    res.end()
  })
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
