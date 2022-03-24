import { loadConfig } from '../utils/config'

const config = loadConfig()
const IS_GREENLIGHT = config.lightning_provider === 'GREENLIGHT'

let libhsmd = {
  Init: function (rootkey: string, chain: string): string {
    return ''
  },

  Handle: function (
    capabilities: number,
    dbid: number,
    peer: string | null,
    payload: string
  ): string {
    return ''
  },
}

if (IS_GREENLIGHT) {
  libhsmd = require('libhsmd')
}

export default libhsmd
