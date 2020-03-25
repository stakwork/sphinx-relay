import React from 'react';
import { Checkbox, Form, Radio } from 'semantic-ui-react'
import {ctx} from '../context.jsx'
import SemanticDatepicker from 'react-semantic-ui-datepickers';
import 'react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css';

class CreateSubscription extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      values: {}
    }
  }

  setValue(key, value) {
    let new_values = {...this.state.values}
    new_values[key] = value
    this.setState({ values: new_values })
  }

  render() {
    const { values } = this.state
    const {contacts,chats} = this.context

    const fields = [
      {
        type:'contacts',
        label:'Contact',
        name:'contact_id'
      },
      {
        type:'chats',
        label:'Chat',
        name:'chat_id'
      },
      {
        type:'radio',
        label:'Payment Interval',
        name:'interval',
        options:['daily','weekly','monthly']
      },
      {
        type:'checkbox',
        label:'Amount',
        name:'amount',
        options:[500,1000,2000,'custom']
      },
      {
        type:'multi',
        label:'End Rule',
        name:'endRule',
        options:[{
          name:'end_number',
          type:'number',
          label:'Make Payments'
        },{
          name:'end_date',
          type:'date',
          label:'Pay Until'
        }]
      }
    ]

    const ready = values.contact_id && //values.chat_id && 
      values.interval && values.amount &&  (
      (values.endRule==='date' && values.end_date) || 
      (values.endRule==='number' && values.end_number)
    )

    return (
      <Form onSubmit={() => {
        const v = {
          interval: values.interval,
          contact_id: values.contact_id,
          amount: values.amount,
        }
        if(values.chat_id){
          v.chat_id = values.chat_id
        }
        if(values.endRule==='date'){
          v.end_date = values.end_date
        }
        if(values.endRule==='number'){
          v.end_number = values.end_number
        }
        this.props.onSave(v)
      }}>
        
        {fields.map(f=>{

          if(f.type==='contacts'){
            return (<Form.Field key={f.name}>
              <label>{f.label}:</label>
              <select onChange={event => this.setValue(f.name,parseInt(event.target.value))}>
                {contacts.map(contact => (
                  <option value={contact.id} key={contact.id}>{contact.alias} ({contact.public_key})</option>
                ))}
              </select>
            </Form.Field>)
          }

          if(f.type==='chats'){
            return (<Form.Field key={f.name}>
              <label>{f.label}:</label>
              <select onChange={event => this.setValue(f.name,parseInt(event.target.value))}>
                <option>Select Chat:</option>
                {chats.map(chat => (
                  <option value={chat.id} key={chat.id}>{chat.uuid}</option>
                ))}
              </select>
            </Form.Field>)
          }

          if(f.type==='radio'){
            return (<Form.Field key={f.name}>
              <label>{f.label}: <b>{values[f.name]}</b></label>
              {f.options.map(o=>(
                <Form.Field key={o}>
                  <Radio
                    label={o}
                    name={f.name}
                    value={o}
                    checked={values[f.name] === o}
                    onChange={()=> this.setValue(f.name, o)}
                  />
                </Form.Field>
              ))}
            </Form.Field>)
          }

          if(f.type==='checkbox'){
            return (<Form.Field key={f.name}>
              <label>{f.label}: <b>{values[f.name]}</b></label>
              {f.options.map(o=>{
                if(o==='custom'){
                  return (<Form.Field key={o}>
                    <span>Custom amount:</span>
                    <input value={values[f.name]} onChange={e => this.setValue(f.name, parseInt(e.target.value))} type="number" />
                  </Form.Field>)
                }
                return (<Form.Field key={o}>
                  <Checkbox
                    label={o}
                    name={f.name}
                    value={o}
                    checked={values[f.name] === o}
                    onChange={()=> this.setValue(f.name, o)}
                  />
                </Form.Field>)
              })}
            </Form.Field>)
          }

          if(f.type==='multi'){
            return (<Form.Field key={f.name}>
              <label>{f.label}:</label>
              {f.options.map(o=>{
                if(o.type==='date'){
                  return (<div key={o.name}>
                    <Checkbox
                      label={o.label}
                      name={f.name}
                      value={o.type}
                      checked={values[f.name] === o.type}
                      onChange={()=> this.setValue(f.name, o.type)}
                    />&nbsp;&nbsp;
                    <SemanticDatepicker disabled={values[f.name] !== o.type} 
                      onChange={(e,a)=>this.setValue(o.name,a.value.toDateString())} 
                    />
                  </div>)
                }
                if(o.type==='number'){
                  return (<div key={o.name}>
                    <Checkbox
                      label={o.label}
                      name={f.name}
                      value={o.type}
                      checked={values[f.name] === o.type}
                      onChange={()=> this.setValue(f.name, o.type)}
                    />&nbsp;&nbsp;
                    <input disabled={values[f.name] !== o.type} value={values[o.name]} 
                      onChange={e => this.setValue(o.name, parseInt(e.target.value))} type="number" 
                      style={{display:'inline-block',width:'80%',verticalAlign:'middle'}}
                    />
                  </div>)
                }
              })}
            </Form.Field>)
          }
        })}

        <div>
          <button disabled={!ready} className="ui button primary">Save</button>
        </div>
      </Form>
    )
  }
}

CreateSubscription.contextType = ctx
export default CreateSubscription