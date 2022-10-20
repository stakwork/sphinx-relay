"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const path = require("path");
const minimist = require("minimist");
const argv = minimist(process.argv.slice(2));
if (!argv.config && process.env.RELAY_CONFIG) {
    argv.config = process.env.RELAY_CONFIG;
}
const configFile = argv.config
    ? path.resolve(process.cwd(), argv.config)
    : path.join(__dirname, '../../config/app.json');
const env = process.env.NODE_ENV || 'development';
const config = require(configFile)[env];
const ENV = process.env;
const DEFAULT_HSM_SECRET_PATH = './creds/hsm_secret';
const DEFAULT_TLS_LOCATION = './creds/ca.pem';
const DEFAULT_TLS_KEY_LOCATION = './creds/device-key.pem';
const DEFAULT_TLS_CHAIN_LOCAION = './creds/device.crt';
const DEFAULT_SCHEDULER_TLS_LOCATION = './creds/scheduler_creds/ca.pem';
const DEFAULT_SCHEDULER_KEY_LOCATION = './creds/scheduler_creds/device-key.pem';
const DEFAULT_SCHEDULER_CHAIN_LOCATION = './creds/scheduler_creds/device.crt';
const DEFAULT_TRANSPORT_PUBLIC_KEY_LOCATION = './creds/transportTokenPublicKey.pem';
const DEFAULT_TRANSPORT_PRIVATE_KEY_LOCATION = './creds/transportTokenPrivateKey.pem';
const DEFAULT_LENGTH_DELAY_FOR_TRANSPORT_TOKEN_DB_CLEARING = 1;
function loadConfig() {
    const logg = ENV.LOGGING || config.logging;
    const provider = ENV.LIGHTNING_PROVIDER || config.lightning_provider || 'LND';
    return {
        lightning_provider: provider,
        logging: logg || 'TRIBES,MEME,NOTIFICATION,EXPRESS,NETWORK,DB,PROXY,LSAT,BOTS',
        senza_url: ENV.SENZA_URL || config.senza_url,
        macaroon_location: ENV.MACAROON_LOCATION || config.macaroon_location,
        router_macaroon_location: ENV.ROUTER_MACAROON_LOCATION || config.router_macaroon_location,
        signer_macaroon_location: ENV.SIGNER_MACAROON_LOCATION || config.signer_macaroon_location,
        tls_location: ENV.TLS_LOCATION || config.tls_location || DEFAULT_TLS_LOCATION,
        tls_key_location: ENV.TLS_KEY_LOCATION ||
            config.tls_key_location ||
            DEFAULT_TLS_KEY_LOCATION,
        tls_chain_location: ENV.TLS_CHAIN_LOCATION ||
            config.tls_chain_location ||
            DEFAULT_TLS_CHAIN_LOCAION,
        scheduler_tls_location: ENV.SCHEDULER_TLS_LOCATION ||
            config.scheduler_tls_location ||
            DEFAULT_SCHEDULER_TLS_LOCATION,
        scheduler_key_location: ENV.SCHEDULER_KEY_LOCATION ||
            config.scheduler_key_location ||
            DEFAULT_SCHEDULER_KEY_LOCATION,
        scheduler_chain_location: ENV.SCHEDULER_CHAIN_LOCATION ||
            config.scheduler_chain_location ||
            DEFAULT_SCHEDULER_CHAIN_LOCATION,
        hsm_secret_path: ENV.HSM_SECRET_PATH || config.hsm_secret_path || DEFAULT_HSM_SECRET_PATH,
        lnd_log_location: ENV.LND_LOG_LOCATION || config.lnd_log_location,
        node_ip: ENV.NODE_IP || config.node_ip,
        lnd_ip: ENV.LND_IP || config.lnd_ip,
        node_http_protocol: ENV.NODE_HTTP_PROTOCOL || config.node_http_protocol,
        node_http_port: ENV.NODE_HTTP_PORT || config.node_http_port,
        lnd_port: ENV.LND_PORT || config.lnd_port,
        hub_api_url: ENV.HUB_API_URL || config.hub_api_url,
        hub_url: ENV.HUB_URL || config.hub_url,
        hub_invite_url: ENV.HUB_INVITE_URL || config.hub_invite_url,
        hub_check_invite_url: ENV.HUB_CHECK_INVITE_URL || config.hub_check_invite_url,
        media_host: ENV.MEDIA_HOST || config.media_host,
        tribes_host: ENV.TRIBES_HOST || config.tribes_host,
        people_host: ENV.PEOPLE_HOST || config.people_host || "people.sphinx.chat",
        tribes_mqtt_port: ENV.TRIBES_MQTT_PORT || config.tribes_mqtt_port,
        mqtt_host: ENV.MQTT_HOST || config.mqtt_host,
        tribes_insecure: ENV.TRIBES_INSECURE || config.tribes_insecure,
        public_url: ENV.PUBLIC_URL || config.public_url,
        connection_string_path: ENV.CONNECTION_STRING_PATH || config.connection_string_path,
        ssl: {
            enabled: ENV.SSL_ENABLED || (config.ssl && config.ssl.enabled) ? true : false,
            save: ENV.SSL_SAVE || (config.ssl && config.ssl.save) ? true : false,
            port: ENV.SSL_PORT || (config.ssl && config.ssl.port),
        },
        encrypted_macaroon_path: ENV.ENCRYPTED_MACAROON_PATH || config.encrypted_macaroon_path,
        loop_macaroon_location: ENV.LOOP_MACAROON_LOCATION || config.loop_macaroon_location,
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
        transportPrivateKeyLocation: ENV.TRANSPORT_PRIVATE_KEY_LOCATION ||
            config.transportPrivateKeyLocation ||
            DEFAULT_TRANSPORT_PRIVATE_KEY_LOCATION,
        transportPublicKeyLocation: ENV.TRANSPORT_PUBLIC_KEY_LOCATION ||
            config.transportPublicKeyLocation ||
            DEFAULT_TRANSPORT_PUBLIC_KEY_LOCATION,
        logging_level: ENV.LOGGING_LEVEL || config.logging_level || 'info',
        length_of_time_for_transport_token_clear: ENV.LENGTH_OF_TIME_FOR_TRANSPORT_TOKEN_CLEAR ||
            config.length_of_time_for_transport_token_clear ||
            DEFAULT_LENGTH_DELAY_FOR_TRANSPORT_TOKEN_DB_CLEARING,
    };
}
exports.loadConfig = loadConfig;
//# sourceMappingURL=config.js.map