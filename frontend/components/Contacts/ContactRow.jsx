import React, {useState} from 'react';
import ContactForm from './ContactForm.jsx'
import styles from './styles'
import * as api from '../../api'

export default function ({contact,onSave,chats}){
  const [edit, setEdit] = useState(false)
  const [pay, setPay] = useState(false)
  const [amount, setAmount] = useState(0)
  const [paying, setPaying] = useState(false)

  if (edit) {
    return (
      <li style={{background:'#eee',padding:10}}>
        <ContactForm contact={contact} onSave={(id, values) => {
          onSave(id, values)
          setEdit(false)
        }} onCancel={()=>setEdit(false)} />
      </li>
    )
  }

  function payButton() {
    if(pay){
      confirmPay()
    } else {
      setPay(true)
      setAmount(0)
    }
  }
  async function confirmPay() {
    const amt = parseInt(amount)
    console.log(chats)
    console.log(contact)
    const chatz = chats && chats.filter(c=> c.contact_ids.includes(parseInt(contact.id)))
    console.log(chatz)
    let chat
    let n = 9999999
    chatz && chatz.forEach(c=>{
      if(c.contact_ids.length<n) {
        n = c.contact_ids.length
        chat = c // smallest for this user
      }
    })
    console.log(chat)
    if(!chat) return
    setPaying(true)
    if(window.testPurchaseMUID) {
      await api.relay.POST('purchase',{
        chat_id: chat.id,
        contact_id: contact.id,
        amount: amt,
        muid: window.testPurchaseMUID
      })
    } else {
      await api.relay.POST('payment',{
        chat_id: chat.id,
        contact_id: contact.id,
        amount: amt,
      })
    }
    setPay(false)
    setPaying(false)
  }
  return <div style={styles.contact}>
    <div>
      <b>{contact.alias}</b> local_id: {contact.id}; remote_id: {contact.remote_id} <br />
      <a style={{color:'blue'}}>{contact.public_key}</a><br/>
      {contact.is_owner && <span className="ui label green">Is Node Owner</span>}
      {contact.photo_url && 
        <div>
          <a href={contact.photo_url} target="_blank">{contact.photo_url}</a>
        </div>
      }
      <a onClick={() => setEdit(true)}>Edit</a>
    </div>
    {!contact.is_owner && <div style={styles.payer}>
      {pay && <div style={styles.x} onClick={()=>setPay(false)}>x</div>}
      {pay && <input type="number" style={styles.input}
        value={amount} onChange={e=> setAmount(e.target.value)}
      />}
      <button style={styles.pay}
        disabled={(pay && !amount) || paying}
        onClick={payButton}>
        {pay ? 'Confirm' : `Pay ${contact.alias}`}
      </button>
    </div>}
  </div>
}
