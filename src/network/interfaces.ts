export interface Msg {
  type: number
  message: {
    uuid: string
    content: string
    amount: number
  }
  chat: {
    uuid: string
  }
  sender: {
    pub_key: string
    alias: string
    role: number
    route_hint?: string
  }
}
