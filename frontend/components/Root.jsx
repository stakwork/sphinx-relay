import React from 'react';
import Contacts from './Contacts/index.jsx'
import Messages from './Messages/index.jsx'
import Channels from './Channels/index.jsx'
import { Tab } from 'semantic-ui-react'
import Login from './Login.jsx'
import {ctx} from './context.jsx'
import Subscriptions from './Subscriptions/index.jsx';
import Media from './Media/index.jsx';

class Root extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      identity_pubkey: null,
      balance: null,
      pending_open_balance: null,
      messages: [],
      contacts: [],
      subscriptions: [],
      chats: [],
    }
    this.getSubscriptions = this.getSubscriptions.bind(this)
  }

  componentDidMount() {
    document.title = location.hostname
    if (this.props.isLoggedIn) {
      this.getBalance()
      this.getInfo()
      this.connectSocket()
      this.getContacts()
      this.getMessages()
      this.getSubscriptions()
      this.getChats()
      this.listPayments()
      this.getLogs()
    }
  }

  connectSocket() {
    let protocol = (location.protocol == 'https:') ? 'wss' : 'ws'
    this.socket = new WebSocket(`${protocol}://${location.hostname}:${location.port}/sphinx_chat`)
    this.socket.onopen = () => {
      console.log('socket opened')
    }
    this.socket.onmessage = event => {
      const message = JSON.parse(event.data)
      console.log('received message', { message })
      const messages = [...this.state.messages, message]
      this.setState({messages})
    }
  }

  listPayments() {
    fetch('/payments').then(r => r.json()).then(body => {
      console.log("payments",body)
    })
  }

  getLogs() {
    fetch('/logs').then(r => r.json()).then(body => {
      console.log("logs",body)
    })
  }

  getBalance() {
    fetch('/balance').then(r => r.json()).then(body => {
      const { balance, pending_open_balance } = body.response
      console.log(balance)
      this.setState({ balance, pending_open_balance })
    })
  }

  getSubscriptions(){
    fetch('/subscriptions').then(r => r.json()).then(body => {
      this.setState({ subscriptions: body.response })
    })
  }

  getInfo() {
    fetch('/getinfo').then(r => r.json()).then(body => {
      console.log(body.response)
      const { identity_pubkey } = body.response
      this.setState({ identity_pubkey })
    })
  }

  getMessages() {
    fetch('/messages').then(r => r.json()).then(body => {
      this.setState({ messages: body.response.new_messages })
    })
  }

  getContacts() {
    console.log("get contacts")
    fetch('/contacts').then(r => r.json()).then(body => {
      this.setState({ contacts: body.response.contacts })
    })
  }

  getChats() {
    fetch('/chats').then(r => r.json()).then(body => {
      this.setState({ chats: body.response })
    })
  }

  render() {
    const { balance, pending_open_balance, messages, channels, identity_pubkey, contacts, chats } = this.state

    if (!this.props.isLoggedIn) {
      return <Login />
    }

    return (
      <ctx.Provider value={this.state}>
        <div className="ui container" style={{marginTop:20}}>
          <h2>Sphinx Chat</h2>

          <div style={{margin:'10px 0 20px 0'}}>
            <div>Host: {document.location.host}</div>
            <div>Identity Pubkey: {identity_pubkey}</div>
            <div>Channel balance: {balance}</div>
            <div>Pending open balance: {pending_open_balance}</div>
          </div>

          <Tab
            panes={[
              { menuItem: 'Contacts', render: () => <Tab.Pane><Contacts /></Tab.Pane> },
              { menuItem: 'Messages', render: () => <Tab.Pane><Messages /></Tab.Pane> },
              { menuItem: 'Channels', render: () => <Tab.Pane><Channels /></Tab.Pane> },
              { menuItem: 'Subscriptions', render: () => <Tab.Pane><Subscriptions getSubscriptions={this.getSubscriptions} /></Tab.Pane> },
              { menuItem: 'Media', render: () => <Tab.Pane><Media 
                contacts={contacts} chats={chats}
                identity_pubkey={identity_pubkey}
              /></Tab.Pane> },
            ]}
            renderActiveOnly={true}
          />
        </div>
      </ctx.Provider>
    )
  }
}

Root.contextType = ctx
export default Root;
