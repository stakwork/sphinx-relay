import { execSync } from 'child_process'
import { sphinxLogger } from './logger'

function git(command: string): string | void {
  try {
    return execSync(`git ${command}`).toString().trim()
  } catch (e) {
    sphinxLogger.error(
      'Error running a git command, probably not running in a git repository'
    )
    sphinxLogger.error(e)
  }
}

export const commitHash = git('log -1 --pretty=format:%h') || ''
export const tag = git('describe --abbrev=0 --tags') || ''
