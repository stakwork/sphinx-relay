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
