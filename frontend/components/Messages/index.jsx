import React from 'react';
import {ctx} from '../context.jsx'

class Messages extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      dest: '',
    }
  }

  onSelectContact(contact_id) {
    const contact = this.context.contacts.find(c => c.id == contact_id)
    this.setState({
      dest: contact.public_key,
      contact_id: contact_id
    })
  }

  onSelectChat(chat_id) {
    this.setState({
      chat_id: chat_id
    })
  }

  render() {
    const { dest, contact_id, chat_id, text } = this.state
    const {messages, contacts, chats} = this.context
    const ready = contact_id && dest && text
    return (
      <div>
        <h3>Send Message</h3>
        <form method="POST" action="/messages" className="ui form">
          <label>Contacts:</label>
          <select onChange={value => this.onSelectContact(event.target.value)}>
            {contacts && contacts.map(contact => (
              <option value={contact.id}>{contact.alias} ({contact.public_key})</option>
            ))}
          </select>
          <br />
          <label>Chats:</label>
          <select onChange={value => this.onSelectChat(event.target.value)}>
            <option>Select Chat:</option>
            {chats && chats.map(chat => (
              <option value={chat.id}>{chat.uuid}</option>
            ))}
          </select>
          <p>
            <input type="text" name="destination_key" placeholder="destination pubkey" value={dest} onChange={e => this.setState({dest: e.target.value})} />
          </p>
          <p>
            <input type="text" name="contact_id" placeholder="contact_id" value={contact_id} onChange={e => this.setState({contact_id: e.target.value})} />
          </p>
          <p>
            <input type="text" name="chat_id" placeholder="chat_id" value={chat_id} onChange={e => this.setState({chat_id: e.target.value})} />
          </p>
          <p>
            <input type="text" name="text" placeholder="message text" value={text} onChange={e=>this.setState({text:e.target.value})}/>
          </p>
          <p>
            <input type="submit" value="Send" className="ui button primary" disabled={!ready}/>
          </p>
        </form>
        <h3>Messages</h3>
        <ol>
          {messages && messages.map(message => (
            <li>{JSON.stringify(message, null, 2)}</li>
          ))}
        </ol>
        <form action="/messages/clear" method="POST" className="ui form">
          <button className="ui button">Clear Messages</button>
        </form>
      </div>
    )
  }
}

Messages.contextType = ctx
export default Messages