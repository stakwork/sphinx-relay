import React from 'react';
import { setCookie } from '../cookies'

class Login extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      code: null
    }
  }

  onSubmit(e) {
    e.preventDefault()

    fetch("/login", {
      method: "POST",
      body:    JSON.stringify({ code: this.state.code }),
	    headers: { 'Content-Type': 'application/json' }
    })
    .then(r => r.json())
    .then(json => {
      if (json.success) {
        setCookie('x-user-token', json.token)
        document.location = "/app"
      } else {
        alert("Wrong passcode.")
      }
    })
  }

  render() {
    return (
      <div className="ui container" style={{marginTop:20}}>
        <h2>Sphinx Login</h2>

        <form className="ui form" style={{maxWidth:300}} onSubmit={this.onSubmit.bind(this)}>
          <input type="password" name="code" onChange={e => this.setState({ code: e.target.value })} value={this.state.code} style={{marginBottom:10}} placeholder="Enter passcode" />
          <input className="ui button" type="submit" value="Login" />
        </form>
      </div>
    )
  }
}

export default Login;
