import { exec } from 'child_process'
import { sphinxLogger } from './logger'

let commitHash
function checkCommitHash(): Promise<string> {
  return new Promise((resolve) => {
    if (commitHash) {
      return resolve(commitHash)
    }
    try {
      exec(
        `git log -1 --pretty=format:%h`,
        { timeout: 999 },
        (error, stdout) => {
          if (stdout) {
            commitHash = stdout.trim()
            return resolve(commitHash)
          } else {
            resolve('')
          }
        }
      )
    } catch (e) {
      sphinxLogger.error(e)
      resolve('')
    }
  })
}

let tag
function checkTag(): Promise<string> {
  return new Promise((resolve) => {
    if (tag) {
      return resolve(tag)
    }
    try {
      exec(
        `git describe --abbrev=0 --tags`,
        { timeout: 999 },
        (error, stdout) => {
          if (stdout) {
            tag = stdout.trim()
            return resolve(tag)
          } else {
            resolve('')
          }
        }
      )
    } catch (e) {
      sphinxLogger.error(e)
      resolve('')
    }
  })
}

export { checkCommitHash, checkTag }
