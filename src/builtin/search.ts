import * as Sphinx from 'sphinx-bot'
import { sphinxLogger, logging } from '../utils/logger'
import { finalAction } from '../controllers/botapi'
import { models, ChatRecord, GraphSubscriptionRecord } from '../models'
import fetch from 'node-fetch'

const msg_types = Sphinx.MSG_TYPE

let initted = false

interface SearchResult {
  description: string
  show_title: string
}

export function init() {
  if (initted) return
  initted = true

  const client = new Sphinx.Client()
  client.login('_', finalAction)

  client.on(msg_types.MESSAGE, async (message: Sphinx.Message) => {
    if (!message.content) return
    const arr = message.content.split(' ')
    if (arr.length < 3) return
    if (arr[0] !== '/search') return
    const cmd = arr[1]

    try {
      const tribe = (await models.Chat.findOne({
        where: { uuid: message.channel.id },
      })) as ChatRecord
      switch (cmd) {
        case 'search':
          const graphs =
            (await models.GraphSubscription.findAll()) as GraphSubscriptionRecord[]
          const searchWord = `${arr.slice(1, arr.length).join(' ')}`
          const subscriptions = await settleLsat(graphs, searchWord)
          const request = {
            company_name: 'Sphinx',
            tribe_name: tribe.name,
            search_word: searchWord,
            subscriptions,
          }
          const response = await fetch(
            'http://3.95.131.14:5000/prediction/query',
            {
              method: 'POST',
              body: JSON.stringify(request),
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
          if (response.ok) {
            const parsedRes = await response.json()
            console.log(parsedRes)
            let internalRes: SearchResult[] = []
            if (parsedRes.internal?.exact) {
              internalRes = parsedRes.internal?.exact.slice(0, 5)
            }

            let externalRes: SearchResult[] = []
            if (parsedRes.external?.exact) {
              externalRes = parsedRes.external?.exact.slice(0, 5)
            }
            let returnMsg = ''
            for (let i = 0; i < internalRes.length; i++) {
              const result = internalRes[i]
              returnMsg = `${returnMsg} ${result?.description} from ${result?.show_title} \n`
            }
            for (let i = 0; i < externalRes.length; i++) {
              const result = externalRes[i]
              returnMsg = `${returnMsg} ${result.description} from ${result.show_title} \n`
            }
            if (!returnMsg) {
              returnMsg = 'No result found for your search'
            }
            const resEmbed = new Sphinx.MessageEmbed()
              .setAuthor('SearchBot')
              .setDescription(returnMsg)
            message.channel.send({ embed: resEmbed })
            return
          } else {
            const resEmbed = new Sphinx.MessageEmbed()
              .setAuthor('SearchBot')
              .setDescription(
                `Sorry seems there is an issue with your internal private graph ${response.status}`
              )
            message.channel.send({ embed: resEmbed })
            return
          }
        case 'graph':
          if (arr.length !== 4) return
          const name = arr[2]
          const address = arr[3]

          await models.GraphSubscription.create({
            name,
            address,
            status: 1,
            tenant: message.member.id,
            chatIds: JSON.stringify([tribe.id]),
          })
          const resEmbed = new Sphinx.MessageEmbed()
            .setAuthor('SearchBot')
            .setDescription(`Graph Subscription was added successfully`)
          message.channel.send({ embed: resEmbed })
          return
      }
    } catch (error) {
      sphinxLogger.error(`SEARCH BOT ERROR ${error}`, logging.Bots)
    }
  })
}

export async function settleLsat(
  graphs: GraphSubscriptionRecord[],
  word: string
) {
  const newGraphs: {
    client_name: string
    prediction_endpoint: string
    lsat: string
  }[] = []
  for (let i = 0; i < graphs.length; i++) {
    const graph = graphs[i]
    // const lsat = (await models.Lsat.findOne({
    //   where: { paths: graph.address, status: 1 },
    // })) as Lsat
    const obj = {
      client_name: graph.name,
      prediction_endpoint: `${graph.address}?word=${word}`,
      //Correct Implementation
      //   lsat: lsat ? `LSAT ${lsat.macaroon}:${lsat.preimage}` : '',
      lsat: `LSAT AgEba25vd2xlZGdlLWdyYXBoLnNwaGlueC5jaGF0AoQBMDAwMGMzN2QzNjI0NTM3YmVkY2UxZThmYTdmM2Y5ZmVkNDYyMTU2MWJiMmJmODY2YWMzYjMzZmM1NDVjNmY3NjE3NzFhZWU5YmZlYzljOTRhMDI2MDU5ZWZlMzk2MTllNDVkY2Q1YWQ5OWI1Y2JjZDA4MzdlNDUzMjM5OGNiMmQyNjFiAAAGIIB-8uA1VZ5gb1rNaRjjFPfBqlF16JnnQd1fK-VuwebL:cb8779ec0e386c62acc88c409f0730707e643e306678b15018676177c7d336f9`,
    }
    newGraphs.push(obj)
  }
  return newGraphs
}
