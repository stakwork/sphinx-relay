import { success, failure } from '../utils/res'
import * as path from 'path'
import * as fs from 'fs'
import * as network from '../network'

const actionFile = '../../../actions.json'

export async function doAction(req, res) {
    const thePath = path.join(__dirname,actionFile)
    try {
        if (fs.existsSync(thePath)) {
            processExtra(req, res)
        } else {
            failure(res, 'no file')
        }
    } catch(err) {
        console.error(err)
        failure(res, 'fail')
    }
}

async function processExtra(req, res) {
    const actions = require(path.join(__dirname,actionFile))
    if(!(actions&&actions.length)) {
        return failure(res, 'no actions defined')
    }
    const {action,app,secret,pubkey,amount} = req.body
    
    const theApp = actions.find(a=>a.app===app)
    if(!theApp) {
        return failure(res, 'app not found')
    }
    if(!(theApp.secret&&theApp.secret===secret)) {
        return failure(res, 'wrong secret')
    }
    if(!(pubkey&&pubkey.length===66&&amount&&action)) {
        return failure(res, 'wrong params')
    }

    if(action==='keysend') {
        const MIN_SATS = 3
        const destkey = pubkey
        const opts = {
            dest: destkey,
            data: {},
            amt: Math.max((amount||0), MIN_SATS)
        }
        try {
            await network.signAndSend(opts)
            return success(res, {success:true})
        } catch(e) {
            return failure(res, e)
        }
    } else {
        return failure(res, 'no action')
    }
}