import React from 'react';
import {ctx} from '../context.jsx'
import CreateSubscription from './CreateSubscription.jsx'

class Subscriptions extends React.Component {

  constructor(){
    super()
    this.state={
      create:false,
    }
    this.createSub = this.createSub.bind(this)
  }

  createSub(values) {
    fetch(`/subscriptions`, {
      method: 'POST',
      body: new URLSearchParams(values),
      headers: new Headers({
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      })
    })
    .then(r => r.json())
    .then(body => {
      console.log('created subscriptions', { body })
      this.props.getSubscriptions()
      this.setState({create:false})
    })
  }

  render() {
    const { subscriptions } = this.context
    const {create} = this.state
    console.log(subscriptions)
    if(create){
      return <CreateSubscription onSave={this.createSub} />
    }
    return (<>
      <ul>
        {subscriptions.map(sub => (
          <li>
            {/* <a onClick={() => this.setState({dest: channel.remote_pubkey})} style={{color:'blue'}}>{channel.remote_pubkey}</a> */}
            <pre>{JSON.stringify(sub, null, 2)}</pre>
          </li>
        ))}
      </ul>
      <button className="ui button" onClick={() => this.setState({ create: !create })}>Add Subscription</button>
    </>)
  }
}

Subscriptions.contextType = ctx
export default Subscriptions