
import {loadLightning} from '../utils/lightning'
import * as publicIp from 'public-ip'
import {checkTag, checkCommitHash} from '../utils/gitinfo'
import {models} from '../models'

function nodeinfo(){
  return new Promise(async (resolve, reject)=>{
    let public_ip = ""
    try {
      public_ip = await publicIp.v4()
    } catch(e){}

    const commitHash = await checkCommitHash()

    const tag = await checkTag()

    const lightning = loadLightning()
    const owner = await models.Contact.findOne({ where: { isOwner: true }})

    const clean = await isClean()

    try {
      lightning.channelBalance({}, (err, channelBalance) => {
        if(err) console.log(err)
        // const { balance, pending_open_balance } = channelBalance
        lightning.listChannels({}, (err, channelList) => {
          if(err) console.log(err)
          if(!channelList) return
          const { channels } = channelList

          const localBalances = channels.map(c => c.local_balance)
          const remoteBalances = channels.map(c => c.remote_balance)
          const largestLocalBalance = Math.max(...localBalances)
          const largestRemoteBalance = Math.max(...remoteBalances)
          const totalLocalBalance = localBalances.reduce((a, b) => parseInt(a) + parseInt(b), 0)

          lightning.pendingChannels({}, (err, pendingChannels) => {
            if(err) console.log(err)
            lightning.getInfo({}, (err, info) => {
              if(err) console.log(err)
              if(!err && info){
                const node = {
                  node_alias: process.env.NODE_ALIAS,
                  ip: process.env.NODE_IP,
                  relay_commit: commitHash,
                  public_ip: public_ip,
                  pubkey: owner.publicKey,
                  number_channels: channels.length,
                  number_active_channels: info.num_active_channels,
                  number_pending_channels: info.num_pending_channels,
                  number_peers: info.num_peers,
                  largest_local_balance: largestLocalBalance,
                  largest_remote_balance: largestRemoteBalance,
                  total_local_balance: totalLocalBalance,
                  lnd_version: info.version,
                  relay_version: tag,
                  payment_channel: '', // ?
                  hosting_provider: '', // ?
                  open_channel_data: channels,
                  pending_channel_data: pendingChannels,
                  synced_to_chain: info.synced_to_chain,
                  synced_to_graph: info.synced_to_graph,
                  best_header_timestamp: info.best_header_timestamp,
                  testnet: info.testnet,
                  clean,
                }
                resolve(node)
              }
            })
          })
        })
      });
    } catch(e){
      console.log('=>',e)
    }
  })
}

export {nodeinfo}

async function isClean(){
  // has owner but with no auth token
  const cleanOwner = await models.Contact.findOne({ where: { isOwner: true, authToken: null }})
  const msgs = await models.Message.findAll()
  const allContacts = await models.Contact.findAll()
  const noMsgs = msgs.length===0
  const onlyOneContact = allContacts.length===1
  if(cleanOwner && noMsgs && onlyOneContact) return true
  return false
}