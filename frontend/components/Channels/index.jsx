import React from 'react';

export default class Channels extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      channels: [],
    }
  }

  componentDidMount() {
    this.getChannels()
  }

  getChannels() {
    fetch('/channels').then(r => r.json()).then(body => {
      const { channels } = body.response
      this.setState({ channels })
    })
  }

  render() {
    const { channels } = this.state

    return (
      <ul>
        {channels.map(channel =>
          <li>
            <a onClick={() => this.setState({dest: channel.remote_pubkey})} style={{color:'blue'}}>{channel.remote_pubkey}</a>
            <pre>{JSON.stringify(channel, null, 2)}</pre>
          </li>
        )}
      </ul>
    )
  }
}
