import * as fs from 'fs'
import {loadConfig} from './config'

const config = loadConfig()

let inMemoryMacaroon: string = ''; // hex encoded

export function getMacaroon() {
  if (config.unlock) {
    return inMemoryMacaroon
  } else {
    const m = fs.readFileSync(config.macaroon_location)
    return m.toString('hex');
  }
}

export function setInMemoryMacaroon(mac: string) {
  inMemoryMacaroon = mac
}