// export async function confirmBadgeCreatedThroughMessage(
//   node: NodeConfig,
//   chatId: number
// ) {
//   const res = await fetch(
//     `https://liquid.sphinx.chat/balances?pubkey=${node.pubkey}`,
//     { method: 'GET', headers: { 'Content-Type': 'application/json' } }
//   )
//   const results = await res.json()
//   console.log(results)
//   const chatMember = await models.ChatMember.findOne({ where: { chatId } })
//   console.log(chatMember)
// }
//# sourceMappingURL=confirmBadgeCreatedThroughMessage.js.map