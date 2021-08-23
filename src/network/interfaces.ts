export interface Msg {
  type: number
  message: {
    uuid: string
    content: string
    amount: number
    replyUuid?: string
  }
  chat: {
    uuid: string
  }
  sender: {
    id?: number
    pub_key: string
    alias: string
    role: number
    route_hint?: string
  }
}
