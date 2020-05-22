import React, {useState} from 'react';
import styles from '../Contacts/styles'
import { Button, Checkbox, Form } from 'semantic-ui-react'
import * as api from '../../api'
import * as rsa from '../../crypto'

export default class Tribes extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      values: {}
    }
  }

  async onNewTribe(v) {
    const name = v.tribe_name
    console.log("NAME",name)
    const r = await api.relay.POST('group',{
      name,
      is_tribe:true,
    })
    console.log(r)
  }

  async onSave(v) {
    console.log(v)
    const r = await api.relay.POST('tribe',{
      chat_name: v.name,
      uuid: v.uuid,
      group_key: v.group_key,
    })
    console.log(r)
  }

  onCancel() {

  }

  setValue(key, value) {
    let new_values = {...this.state.values}
    new_values[key] = value
    this.setState({ values: new_values })
  }

  render() {
    const {chats} = this.props
    const tribes = chats&&chats.filter(c=>c.type===2)
    const {values} = this.state
    const fields = ['uuid','group_key','name']
    const showTribes = tribes && tribes.length>0 ? true : false
    return <div>
      <div>
        <h3>JOIN TRIBE</h3>
        <Form onSubmit={() => this.onSave(values)}>
          {fields.map(field => (
            <Form.Field key={field}>
              <label>{field}</label>
              <input value={values[field]} onChange={e => this.setValue(field, e.target.value)} />
            </Form.Field>
          ))}
          <div>
            <button className="ui button primary">Save</button>
          </div>
        </Form>
      </div>
      <div><br/>
        <h3>CREATE NEW TRIBE</h3>
        <Form onSubmit={() => this.onNewTribe(values)}>
          {['tribe_name'].map(field => (
            <Form.Field key={field}>
              <label>{field}</label>
              <input value={values[field]} onChange={e => this.setValue(field, e.target.value)} />
            </Form.Field>
          ))}
          <div>
            <button className="ui button primary">Save</button>
          </div>
        </Form>
      </div>
      {showTribes && <div><br/>
        <h3>TRIBES</h3>
        {tribes.map(t=>{
          return <Tribe {...t} key={t.uuid} />
        })}
      </div>}
    </div>
  }
}

function Tribe(t){
  const [text,setText] = useState('')

  async function sendMessage(){
    const encText = await rsa.encrypt(t.group_key,text)
    console.log(t,encText)
    const body = {
      chat_id: t.id,
      remote_text_map: {
        [t.id]: encText
      }
    }
    await api.relay.POST('messages', body)
  }

  return <div style={{border:'1px solid grey',borderRadius:3,marginBottom:6,padding:6}}>
  <div><b>NAME:</b>&nbsp;{t.name}</div>
  <div style={{wordBreak:'break-all'}}><b>UUID:</b>&nbsp;{t.uuid}</div>
  <div style={{wordBreak:'break-all'}}><b>KEY:</b>&nbsp;{t.group_key}</div>
  <div>
    <input value={text} onChange={e=> setText(e.target.value)}/>
    <button onClick={sendMessage}>SEND</button>
  </div>
</div>
}