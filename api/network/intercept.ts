
/*
  process if bot message
  AND return true if it is, and forward to bot
*/

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

// msg.message.content
export function isBotMsg(msg:Msg, sentByMe:boolean){
  return false

  // check if bot msg
  // check my ChatMembers to see if its here
  // OR check my Bots if im the maker

  // process it "bot_cmd"
}
