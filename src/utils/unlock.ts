import * as fs from 'fs'
import * as readline from 'readline'
import * as Lightning from '../grpc/lightning'
import { loadConfig } from './config'
import { sphinxLogger } from './logger'

const config = loadConfig()

/*
"lnd_pwd_path": "/relay/.lnd/.lndpwd"
*/

export async function tryToUnlockLND(): Promise<void> {
  const p = config.lnd_pwd_path
  if (!p) return

  sphinxLogger.info(`==> ${p}`)

  const pwd = await getFirstLine(config.lnd_pwd_path)
  if (!pwd) return

  sphinxLogger.info(`==> ${pwd} ${typeof pwd}`)

  try {
    await Lightning.unlockWallet(String(pwd))
  } catch (e) {
    sphinxLogger.error(`[unlock] Error: ${e}`)
  }
}

async function getFirstLine(pathToFile) {
  const readable = fs.createReadStream(pathToFile)
  const reader = readline.createInterface({ input: readable })
  const line = await new Promise((resolve) => {
    reader.on('line', (line) => {
      reader.close()
      resolve(line)
    })
  })
  readable.close()
  return line
}
