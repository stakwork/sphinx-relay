
export interface Msg {
  type: number,
  message: {
    content: string
  },
  chat: {
    uuid: string
  },
  sender: {
    pub_key: string,
    alias: string,
  }
}