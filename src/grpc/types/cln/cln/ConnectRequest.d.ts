// Original file: proto/cln/node.proto

export interface ConnectRequest {
  id?: string
  host?: string
  port?: number
  _host?: 'host'
  _port?: 'port'
}

export interface ConnectRequest__Output {
  id: string
  host?: string
  port?: number
  _host: 'host'
  _port: 'port'
}
