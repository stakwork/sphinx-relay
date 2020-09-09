import * as Sphinx from 'sphinx-bot'
import { finalAction } from '../controllers/actions'
import * as fetch from 'node-fetch'
const msg_types = Sphinx.MSG_TYPE

let initted = false

/*
curl -H "X-CMC_PRO_API_KEY: 2fddf900-9114-471c-849d-cad3e3923e5b" -H "Accept: application/json" -d "symbol=BTC&convert=USD" -G https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest
*/

const token = '2fddf900-9114-471c-849d-cad3e3923e5b'
const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'

export function init() {
  if(initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    const arr = message.content.split(' ')
    if (arr.length < 2) return
    if (arr[0]!=='/btc') return
    const cmd = arr[1]
    
    switch (cmd) {

      case 'price':
        console.log("price", arr[2])
        try {
            const r = await fetch(url+'?symbol=BTC&convert=USD',{
                headers:{'X-CMC_PRO_API_KEY': token, 'Accept': 'application/json'}
            })
            if (!r.ok) return
            const j = await r.json()
            const price = '$'+j.data.BTC.quote.USD.price.toFixed(2)
            const percentChange24 = j.data.BTC.quote.USD.percent_change_24h
            const percentChange24String = percentChange24.toFixed(2)+'%'
            const changeColor = percentChange24>0?'#00c991':'#7a2d2f'
            const embed = new Sphinx.MessageEmbed()
              .setAuthor('BitcoinBot')
              .setTitle('Bitcoin Price:')
              .addFields([
                { name: 'Price:', value: price, inline:true },
                { name: '24 Hour Change:', value: percentChange24String, inline:true, color:changeColor }
              ])
              .setThumbnail(botSVG)
            message.channel.send({ embed })
        } catch(e){
            console.log('BTC bot error',e)
        }
        return
        
      default:
        const embed = new Sphinx.MessageEmbed()
          .setAuthor('BitcoinBot')
          .setTitle('BitcoinBot Commands:')
          .addFields([
            { name: 'Print BTC price', value: '/btc price' },
            { name: 'Help', value: '/btc help' }
          ])
          .setThumbnail(botSVG)
        message.channel.send({ embed })
        return
    }
  })
}

const botSVG = `<svg viewBox="64 64 896 896" height="12" width="12" fill="white">
  <path d="M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" />
</svg>`