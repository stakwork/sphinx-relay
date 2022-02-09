export interface Tribe {
  uuid: string
  owner_pubkey: string
  owner_alias: string
  group_key: string
  name: string
  unique_name: string
  description: string
  tags: string[]
  img: string
  price_to_join: number
  price_per_message: number
  escrow_amount: number
  escrow_millis: number
  created: string
  updated: string
  member_count: number
  unlisted: boolean
  private: boolean
  deleted: boolean
  app_url: string
  feed_url: string
  feed_type: number
  last_active: number
  bots: string //json
  owner_route_hint: string
  pin: string
}
