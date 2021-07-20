
import { loadConfig } from '../utils/config'

const config = loadConfig()
const IS_GREENLIGHT = config.lightning_provider === "GREENLIGHT";

var libhsmd = {
    Init: function(rootkey:string,chain:string): string { return '' },
    Handle: function(capabilities:number,peer,dbid,payload:string): string { return '' }
}

if(IS_GREENLIGHT) {
    libhsmd = require('libhsmd')
}

export default libhsmd