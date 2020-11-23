import * as fs from 'fs'
import * as path from 'path'

const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../../config/app.json'))[env]

let inMemoryMacaroon: string = ''; // hex encoded

export function getMacaroon() {
  if(config.unlock) {
    return inMemoryMacaroon
  } else {
    const m = fs.readFileSync(config.macaroon_location)
    return m.toString('hex');
  }
}

export function setInMemoryMacaroon(mac:string) {
  inMemoryMacaroon = mac
}