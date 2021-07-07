import * as fs from 'fs'
import { loadConfig } from './config'

const config = loadConfig()

let inMemoryMacaroon: string = '' // hex encoded

export function getMacaroon(macName?: string) {
  if (config.unlock) {
    return inMemoryMacaroon
  } else {
    let macLocation = config.macaroon_location
    if (macName) {
      const location = config[`${macName.split('.')[0]}_macaroon_location`]
      macLocation = location || macLocation.replace('admin.macaroon', macName)
    }
    const m = fs.readFileSync(macLocation)
    return m.toString('hex')
  }
}

export function setInMemoryMacaroon(mac: string) {
  inMemoryMacaroon = mac
}
