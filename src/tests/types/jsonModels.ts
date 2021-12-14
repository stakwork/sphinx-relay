export interface Contact {
  id: number
  route_hint: string
  public_key: string
  node_alias: string
  alias: string
  photo_url: string
  private_photo: boolean
  is_owner: boolean
  deleted: boolean
  auth_token: string
  remote_id: number
  status: number
  contact_key: string
  device_id: string
  created_at: Date
  updated_at: Date
  from_group: boolean
  notification_sound: string
  last_active: Date
  tip_amount: number
  tenant: number
  price_to_meet: number
  unmet: boolean
}

export interface Message {
  id: number
  message_content: string
  seen: number
  chat_id: number
  uuid: string
  sender: number
  amount: number
  date: string
  remote_message_content: string
  status: boolean
  created_at: string
  updated_at: string
  network_type: number
  tenant: number
  amount_msat: number
  media_token: string
  media_key: string
  sender_alias: string
  sender_pic: string
}

export interface Chat {
  id: number
  uuid: string
  name: string
  photo_url: string
  type: number
  status: number
  contact_ids: number[]
  is_muted: boolean
  created_at: string
  updatet_at: string
  deleted: boolean
  group_key: string
  host: string
  price_to_join: number
  price_per_message: number
  escrow_amount: number
  escrow_millis: number
  unlisted: boolean
  private: boolean // joining requires approval of admin
  owner_pubkey: string
  app_url: string
  feed_url: string
  feed_type: number
  owner_route_hint?: string
  img: string
}
