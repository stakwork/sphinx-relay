import * as Lightning from '../grpc/lightning'
import {loadConfig} from './config'
const fs = require('fs')
const readline = require('readline');

const config = loadConfig()

/*
"lnd_pwd_path": "/relay/.lnd/.lndpwd"
*/

export async function tryToUnlockLND() {
    const p = config.lnd_pwd_path
    if (!p) return

    console.log('==>', p)

    var pwd = await getFirstLine(config.lnd_pwd_path);
    if (!pwd) return

    console.log('==>', pwd, typeof pwd)

    try {
        await Lightning.unlockWallet(String(pwd))
    } catch (e) {
        console.log('[unlock] Error:', e)
    }
}

async function getFirstLine(pathToFile) {
    const readable = fs.createReadStream(pathToFile);
    const reader = readline.createInterface({ input: readable });
    const line = await new Promise((resolve) => {
        reader.on('line', (line) => {
            reader.close();
            resolve(line);
        });
    });
    readable.close();
    return line;
}


