
import * as moment from 'moment'
import * as zbase32 from './zbase32'
import * as LND from './lightning'
import * as path from 'path'
import * as mqtt from 'mqtt'

const env = process.env.NODE_ENV || 'development'
const config = require(path.join(__dirname,'../../config/app.json'))[env]

let client:any

export async function connect(connectedCallback, onMessage) {
    const pwd = await genSignedTimestamp()
    const info = await LND.getInfo()

    console.log('[tribes] try to connect:',`tcp://${config.tribes_host}`)

    client = mqtt.connect(`tcp://${config.tribes_host}`,{
        username:info.identity_pubkey,
        password:pwd,
    })

    client.on('connect', function () {
        console.log("[tribes] connected!")
        if(connectedCallback) connectedCallback(client, info.identity_pubkey)
        // subscribe to all public groups here
        // that you are NOT admin of (dont sub to your own!)
    })
    client.on('close', function () {
        //console.log("MQTT CLOSED")
    })
    client.on('message', function(topic, message) {
        if(onMessage) onMessage(topic, message)
    })
}

export function subscribe(topic){
    if(client) client.subscribe(topic)
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