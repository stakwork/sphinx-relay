
export interface Msg {
  type: number,
  message: {
    content: string,
    amount: number,
  },
  chat: {
    uuid: string
  },
  sender: {
    pub_key: string,
    alias: string,
    role: number
  }
}