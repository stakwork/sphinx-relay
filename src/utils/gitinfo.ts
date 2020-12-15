import { exec } from 'child_process'

let commitHash
function checkCommitHash() {
  return new Promise((resolve, reject) => {
    if (commitHash) {
      return resolve(commitHash)
    }
    try {
      exec(`git log -1 --pretty=format:%h`, { timeout: 999 }, (error, stdout, stderr) => {
        if (stdout) {
          commitHash = stdout.trim()
          return resolve(commitHash)
        } else {
          resolve('')
        }
      })
    } catch (e) {
      console.log(e)
      resolve('')
    }
  })
}

let tag
function checkTag() {
  return new Promise((resolve, reject) => {
    if (tag) {
      return resolve(tag)
    }
    try {
      exec(`git describe --abbrev=0 --tags`, { timeout: 999 }, (error, stdout, stderr) => {
        if (stdout) {
          tag = stdout.trim()
          return resolve(tag)
        } else {
          resolve('')
        }
      })
    } catch (e) {
      console.log(e)
      resolve('')
    }
  })
}

export {
  checkCommitHash, checkTag
}