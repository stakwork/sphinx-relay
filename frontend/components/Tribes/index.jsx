import React from 'react';
import styles from '../Contacts/styles'
import { Button, Checkbox, Form } from 'semantic-ui-react'
import * as api from '../../api'

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
    const {values} = this.state
    const fields = ['uuid','group_key','name']
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
      <div>
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
    </div>
  }
}
