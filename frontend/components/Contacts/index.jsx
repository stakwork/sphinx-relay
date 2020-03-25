import React from 'react';
import ContactRow from './ContactRow.jsx'
import ContactForm from './ContactForm.jsx'
import {ctx} from '../context.jsx'

class Contacts extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      show_add_contact: false
    }
  }

  updateContact(id, values) {
    fetch(`/contacts/${id}`, {
      method: 'PUT',
      body: new URLSearchParams(values),
      headers: new Headers({
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      })
    })
    .then(r => r.json())
    .then(body => {
      console.log('updated contact', { body })
      this.getContacts()
    })
  }

  createContact(id, values) {
    fetch(`/contacts`, {
      method: 'POST',
      body: new URLSearchParams(values),
      headers: new Headers({
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      })
    })
    .then(r => r.json())
    .then(body => {
      console.log('created contact', { body })
      this.getContacts()
    })
  }

  render() {
    const {contacts,chats} = this.context
    return (
      <div>
        <h3>Contacts</h3>
        <div>
          {contacts && contacts.map(contact =>
            <ContactRow
              chats={chats}
              key={contact.id}
              contact={contact}
              onSave={this.updateContact.bind(this)}
            />
          )}
        </div>
        <button className="ui button" onClick={() => this.setState({ show_add_contact: !!!this.state.show_add_contact })}>Add Contact</button>
        {this.state.show_add_contact && <div>
          <ContactForm
            contact={{}}
            onSave={(id, values) => {
              this.setState({show_add_contact: false})
              this.createContact(null, values)
            }}
          />
        </div>}

        <h3>Upload File</h3>
        <form action="/upload" method="post" enctype="multipart/form-data" className="ui form">
          <div className="field">
            <label>Contact ID</label>
            <input type="text" name="contact_id" placeholder="Contact ID" />
          </div>
          <div className="field">
            <label>File</label>
            <input type="file" name="file" />
          </div>
          <input type="submit" value="Upload" />
        </form>
      </div>
    )
  }
}

Contacts.contextType = ctx
export default Contacts