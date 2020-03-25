import React from 'react';
import { Button, Checkbox, Form } from 'semantic-ui-react'
import styles from './styles'

export default class ContactForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      values: {...props.contact}
    }
  }

  setValue(key, value) {
    let new_values = {...this.state.values}
    new_values[key] = value
    this.setState({ values: new_values })
  }

  render() {
    const { contact, onSave, onCancel } = this.props
    const { values } = this.state
    let fields = ["alias", "node_alias", "id", "public_key"]

    return (
      <Form onSubmit={() => onSave(contact.id, values)}>
        {fields.map(field => (
          <Form.Field key={field}>
            <label>{field}</label>
            <input value={values[field]} onChange={e => this.setValue(field, e.target.value)} />
          </Form.Field>
        ))}
        <Checkbox
          label='Is Owner'
          onChange={() => this.setValue('is_owner', !!!values.is_owner)}
          checked={values.is_owner == true}
        />
        <div>
          <button className="ui button primary">Save</button>
          <div style={styles.x} onClick={onCancel}>x</div>
        </div>
      </Form>
    )
  }
}
