### remote bot

Alice makes a bot. Bob is tribe owner and installs it. Alice is member in the tribe.

- Alice sends text msg (controllers/messages/sendMessage)
- Bob onReceive (from keysend)
- Bob forwardMessageToTribe (with owner)
- Bob to forward to tribe (network/send/sendMessage: intercept.isBotMsg)
- Bob emitMessageToBot (msg.sender.id is there)
- keysendBotCmd
