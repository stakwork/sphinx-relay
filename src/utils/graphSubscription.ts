import { GraphSubscriptionRecord, models, sequelize } from '../models'
export async function graphQuery(id) {
  const results = (await sequelize.query(
    `
      SELECT * FROM sphinx_graph_subscription_chat
      INNER JOIN sphinx_graph_subscription
      ON sphinx_graph_subscription_chat.subscription_id = sphinx_graph_subscription.id
      WHERE sphinx_graph_subscription_chat.chat_id = ${id}`,
    {
      model: models.GraphSubscription,
      mapToModel: true, // pass true here if you have any mapped fields
    }
  )) as GraphSubscriptionRecord[]

  return results
}
