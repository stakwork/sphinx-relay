import * as publicIp from 'public-ip'
import password from '../utils/password'
import {loadConfig} from './config'
const fs = require('fs')

const config = loadConfig()

export async function getQR():Promise<string> {
  let theIP

  const public_url = config.public_url
  if (public_url) theIP = public_url

  if (!theIP) {
    const ip = process.env.NODE_IP
    if (!ip) {
      try {
        theIP = await publicIp.v4()
      } catch (e) { }
    } else {
      const port = config.node_http_port
      theIP = port ? `${ip}:${port}` : ip
    }
  }
  return Buffer.from(`ip::${theIP}::${password || ''}`).toString('base64')
}

export async function connect(req, res) {
  fs.readFile("public/index.html", async function (error, pgResp) {
    if (error) {
      res.writeHead(404);
      res.write('Contents you are looking are Not Found');
    } else {
      const htmlString = Buffer.from(pgResp).toString()
      const qr = await getQR()
      const rep = htmlString.replace(/CONNECTION_STRING/g, qr)
      const final = Buffer.from(rep, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(final);
    }
    res.end();
  });
}