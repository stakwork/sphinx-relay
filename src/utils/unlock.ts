import * as path from 'path'
import { unlockWallet } from './lightning'
const fs = require('fs')
const readline = require('readline');

const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env]

// /relay/.lnd/.lndpwd

export async function tryToUnlockLND() {
    const p = config.lnd_pwd
    if (!p) return

    var pwd = getFirstLine(config.lnd_pwd);
    if(!pwd) return

    await unlockWallet(pwd)
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


