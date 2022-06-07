import * as path from 'path'
import * as minimist from 'minimist'
import { readFileSync } from 'fs'

export type LightningProvider = 'LND' | 'GREENLIGHT'

export interface Config {
  lightning_provider: LightningProvider,
  logging: string,
  senza_url: string,
  macaroon_location: string,
  router_macaroon_location: string,
  signer_macaroon_location: string,
  tls_location: string,
  tls_key_location: string,
  tls_chain_location: string,
  scheduler_tls_location: string,
  scheduler_key_location: string,
  scheduler_chain_location: string,
  hsm_secret_path: string,
  lnd_log_location:  string,
  node_ip: string,
  lnd_ip: string,
  node_http_protocol:  string,
  node_http_port: number,
  lnd_port: number,
  hub_api_url: string,
  hub_url: string,
  hub_invite_url: string,
  hub_check_invite_url: string,
  media_host: string,
  tribes_host: string,
  tribes_mqtt_port: number,
  mqtt_host: string,
  tribes_insecure: boolean,
  public_url: string,
  connection_string_path: string,
  ssl: {
    enabled: boolean,
    save: boolean,
    port: number,
  },
  encrypted_macaroon_path: string,
  loop_macaroon_location: string,
  log_file: string,
  unlock: boolean,
  lnd_pwd_path: string,
  connect_ui: string,
  proxy_macaroons_dir: string,
  proxy_tls_location: string,
  proxy_lnd_ip: string,
  proxy_lnd_port: number,
  proxy_admin_token: string,
  proxy_admin_url: string,
  proxy_new_nodes: number, // what TODO
  proxy_initial_sats: number,
  allow_test_clearing: boolean,
  sql_log: string,
  dont_ping_hub: boolean,
  transportPrivateKeyLocation: string,
  transportPublicKeyLocation: string,
  logging_level: string,
  length_of_time_for_transport_token_clear: number
}

const argv = minimist(process.argv.slice(2))

if (!argv.config && process.env.RELAY_CONFIG) {
  argv.config = process.env.RELAY_CONFIG
}

const configFile = argv.config
  ? path.resolve(process.cwd(), argv.config)
  : path.join(__dirname, '../../config/app.json')

const env = process.env.NODE_ENV || 'development'
const config = JSON.parse(readFileSync(configFile).toString())[env]
const ENV = process.env

const DEFAULT_HSM_SECRET_PATH = './creds/hsm_secret'
const DEFAULT_TLS_LOCATION = './creds/ca.pem'
const DEFAULT_TLS_KEY_LOCATION = './creds/device-key.pem'
const DEFAULT_TLS_CHAIN_LOCAION = './creds/device.crt'
const DEFAULT_SCHEDULER_TLS_LOCATION = './creds/scheduler_creds/ca.pem'
const DEFAULT_SCHEDULER_KEY_LOCATION = './creds/scheduler_creds/device-key.pem'
const DEFAULT_SCHEDULER_CHAIN_LOCATION = './creds/scheduler_creds/device.crt'
const DEFAULT_TRANSPORT_PUBLIC_KEY_LOCATION =
  './creds/transportTokenPublicKey.pem'
const DEFAULT_TRANSPORT_PRIVATE_KEY_LOCATION =
  './creds/transportTokenPrivateKey.pem'
const DEFAULT_LENGTH_DELAY_FOR_TRANSPORT_TOKEN_DB_CLEARING = 1

export function loadConfig(): Config {
  return <Config>{
    lightning_provider: ENV.LIGHTNING_PROVIDER || config.lightning_provider || 'LND',
    logging:
      (ENV.LOGGING || config.logging) ||
      'TRIBES,MEME,NOTIFICATION,EXPRESS,NETWORK,DB,PROXY,LSAT',
    senza_url: ENV.SENZA_URL || config.senza_url,
    macaroon_location: ENV.MACAROON_LOCATION || config.macaroon_location,
    router_macaroon_location:
      ENV.ROUTER_MACAROON_LOCATION || config.router_macaroon_location,
    signer_macaroon_location:
      ENV.SIGNER_MACAROON_LOCATION || config.signer_macaroon_location,
    tls_location:
      ENV.TLS_LOCATION || config.tls_location || DEFAULT_TLS_LOCATION,
    tls_key_location:
      ENV.TLS_KEY_LOCATION ||
      config.tls_key_location ||
      DEFAULT_TLS_KEY_LOCATION,
    tls_chain_location:
      ENV.TLS_CHAIN_LOCATION ||
      config.tls_chain_location ||
      DEFAULT_TLS_CHAIN_LOCAION,
    scheduler_tls_location:
      ENV.SCHEDULER_TLS_LOCATION ||
      config.scheduler_tls_location ||
      DEFAULT_SCHEDULER_TLS_LOCATION,
    scheduler_key_location:
      ENV.SCHEDULER_KEY_LOCATION ||
      config.scheduler_key_location ||
      DEFAULT_SCHEDULER_KEY_LOCATION,
    scheduler_chain_location:
      ENV.SCHEDULER_CHAIN_LOCATION ||
      config.scheduler_chain_location ||
      DEFAULT_SCHEDULER_CHAIN_LOCATION,
    hsm_secret_path:
      ENV.HSM_SECRET_PATH || config.hsm_secret_path || DEFAULT_HSM_SECRET_PATH,
    lnd_log_location: ENV.LND_LOG_LOCATION || config.lnd_log_location,
    node_ip: ENV.NODE_IP || config.node_ip,
    lnd_ip: ENV.LND_IP || config.lnd_ip,
    node_http_protocol: ENV.NODE_HTTP_PROTOCOL || config.node_http_protocol,
    node_http_port: parseInt(ENV.NODE_HTTP_PORT || config.node_http_port) || 3001,
    lnd_port: parseInt(ENV.LND_PORT || config.lnd_port) || 10009,
    hub_api_url: ENV.HUB_API_URL || config.hub_api_url,
    hub_url: ENV.HUB_URL || config.hub_url,
    hub_invite_url: ENV.HUB_INVITE_URL || config.hub_invite_url,
    hub_check_invite_url:
      ENV.HUB_CHECK_INVITE_URL || config.hub_check_invite_url,
    media_host: ENV.MEDIA_HOST || config.media_host,
    tribes_host: ENV.TRIBES_HOST || config.tribes_host,
    tribes_mqtt_port: ENV.TRIBES_MQTT_PORT || config.tribes_mqtt_port,
    mqtt_host: ENV.MQTT_HOST || config.mqtt_host,
    tribes_insecure: ENV.TRIBES_INSECURE || config.tribes_insecure,
    public_url: ENV.PUBLIC_URL || config.public_url,
    connection_string_path:
      ENV.CONNECTION_STRING_PATH || config.connection_string_path,
    ssl: {
      enabled:
        ENV.SSL_ENABLED || (config.ssl && config.ssl.enabled) ? true : false,
      save: ENV.SSL_SAVE || (config.ssl && config.ssl.save) ? true : false,
      port: parseInt(ENV.SSL_PORT || (config.ssl && config.ssl.port)) || 80,
    },
    encrypted_macaroon_path:
      ENV.ENCRYPTED_MACAROON_PATH || config.encrypted_macaroon_path,
    loop_macaroon_location:
      ENV.LOOP_MACAROON_LOCATION || config.loop_macaroon_location,
    log_file: ENV.LOG_FILE || config.log_file,
    unlock: ENV.unlock || config.unlock ? true : false,
    lnd_pwd_path: ENV.LND_PWD_PATH || config.lnd_pwd_path,
    connect_ui: ENV.CONNECT_UI || config.connect_ui,
    proxy_macaroons_dir: ENV.PROXY_MACAROONS_DIR || config.proxy_macaroons_dir,
    proxy_tls_location: ENV.PROXY_TLS_LOCATION || config.proxy_tls_location,
    proxy_lnd_ip: ENV.PROXY_LND_IP || config.proxy_lnd_ip,
    proxy_lnd_port: ENV.PROXY_LND_PORT || config.proxy_lnd_port,
    proxy_admin_token: ENV.PROXY_ADMIN_TOKEN || config.proxy_admin_token,
    proxy_admin_url: ENV.PROXY_ADMIN_URL || config.proxy_admin_url,
    proxy_new_nodes: ENV.PROXY_NEW_NODES || config.proxy_new_nodes,
    proxy_initial_sats: ENV.PROXY_INITIAL_SATS || config.proxy_initial_sats,
    allow_test_clearing: ENV.ALLOW_TEST_CLEARING || config.allow_test_clearing,
    sql_log: ENV.SQL_LOG || config.sql_log,
    dont_ping_hub: ENV.DONT_PING_HUB || config.dont_ping_hub,
    transportPrivateKeyLocation:
      ENV.TRANSPORT_PRIVATE_KEY_LOCATION ||
      config.transportPrivateKeyLocation ||
      DEFAULT_TRANSPORT_PRIVATE_KEY_LOCATION,
    transportPublicKeyLocation:
      ENV.TRANSPORT_PUBLIC_KEY_LOCATION ||
      config.transportPublicKeyLocation ||
      DEFAULT_TRANSPORT_PUBLIC_KEY_LOCATION,
    logging_level: ENV.LOGGING_LEVEL || config.logging_level || 'info',
    length_of_time_for_transport_token_clear:
      ENV.LENGTH_OF_TIME_FOR_TRANSPORT_TOKEN_CLEAR ||
      config.length_of_time_for_transport_token_clear ||
      DEFAULT_LENGTH_DELAY_FOR_TRANSPORT_TOKEN_DB_CLEARING,
  }
}
