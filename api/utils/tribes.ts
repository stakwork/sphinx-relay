
import * as moment from 'moment'
import * as zbase32 from './zbase32'
import * as LND from './lightning'
import * as path from 'path'
import * as mqtt from 'mqtt'
import * as fetch from 'node-fetch'

const env = process.env.NODE_ENV || 'development'
const config = require(path.join(__dirname,'../../config/app.json'))[env]

let client:any

export async function connect(onMessage) {
    try{
        const info = await LND.getInfo()

        async function reconnect(){
            client = null
            const pwd = await genSignedTimestamp()
            console.log('[tribes] try to connect:',`tls://${config.tribes_host}:8883`)
            client = mqtt.connect(`tls://${config.tribes_host}:8883`,{
                username:info.identity_pubkey,
                password:pwd,
                reconnectPeriod:0, // dont auto reconnect
            })
            client.on('connect', function () {
                console.log("[tribes] connected!")
                client.subscribe(`${info.identity_pubkey}/#`)
            })
            client.on('close', function (e) {
                setTimeout(()=> reconnect(), 2000)
            })
            client.on('error', function (e) {
                console.log('[tribes] error: ',e.message||e)
            })
            client.on('message', function(topic, message) {
                if(onMessage) onMessage(topic, message)
            })
        }
        reconnect()

    } catch(e){
        console.log("TRIBES ERROR",e)
    }
}

export function subscribe(topic){
    if(client) client.subscribe(topic)
}

export function publish(topic,msg){
    if(client) client.publish(topic,msg)
}

export async function declare({uuid,name,description,tags,img,groupKey,host,pricePerMessage,priceToJoin,ownerAlias,ownerPubkey}) {
    const r = await fetch('https://' + host + '/tribes', {
        method: 'POST' ,
        body:    JSON.stringify({
            uuid, groupKey,
            name, description, tags, img:img||'',
            pricePerMessage:pricePerMessage||0,
            priceToJoin:priceToJoin||0,
            ownerAlias, ownerPubkey,
            
        }),
        headers: { 'Content-Type': 'application/json' }
    })
    const j = await r.json()
    console.log(j)
}

export async function genSignedTimestamp(){
    const now = moment().unix()
    const tsBytes = Buffer.from(now.toString(16), 'hex')
    const sig = await LND.signBuffer(tsBytes)
    const sigBytes = zbase32.decode(sig)
    const totalLength = tsBytes.length + sigBytes.length
    const buf = Buffer.concat([tsBytes, sigBytes], totalLength)
    return urlBase64(buf)
}

export async function verifySignedTimestamp(stsBase64){
    const stsBuf = Buffer.from(stsBase64, 'base64')
    const sig = stsBuf.subarray(4,92)
    const sigZbase32 = zbase32.encode(sig)
    const r = await LND.verifyBytes(stsBuf.subarray(0,4), sigZbase32) // sig needs to be zbase32 :(
    if (r.valid) {
        return r.pubkey
    } else {
        return false
    }
}

export function getHost() {
    return config.tribes_host || ''
}

function urlBase64(buf){
    return buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
}