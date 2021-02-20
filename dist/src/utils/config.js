"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const path = require("path");
const minimist = require("minimist");
const argv = minimist(process.argv.slice(2));
const configFile = argv.config ? argv.config : path.join(__dirname, '../../config/app.json');
const env = process.env.NODE_ENV || 'development';
const config = require(configFile)[env];
const ENV = process.env;
function loadConfig() {
    return {
        senza_url: ENV.SENZA_URL || config.senza_url,
        macaroon_location: ENV.MACAROON_LOCATION || config.macaroon_location,
        tls_location: ENV.TLS_LOCATION || config.tls_location,
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
        tribes_mqtt_port: ENV.TRIBES_MQTT_PORT || config.tribes_mqtt_port,
        tribes_protocol: ENV.TRIBES_PROTOCOL || config.tribes_protocol,
        public_url: ENV.PUBLIC_URL || config.public_url,
        connection_string_path: ENV.CONNECTION_STRING_PATH || config.connection_string_path,
        ssl: {
            enabled: (ENV.SSL_ENABLED || (config.ssl && config.ssl.enabled)) ? true : false,
            save: (ENV.SSL_SAVE || (config.ssl && config.ssl.save)) ? true : false,
            port: ENV.SSL_PORT || (config.ssl && config.ssl.port)
        },
        encrypted_macaroon_path: ENV.ENCRYPTED_MACAROON_PATH || config.encrypted_macaroon_path,
        loop_macaroon_location: ENV.LOOP_MACAROON_LOCATION || config.loop_macaroon_location,
        log_file: ENV.LOG_FILE || config.log_file,
        unlock: (ENV.unlock || config.unlock) ? true : false,
        lnd_pwd_path: ENV.LND_PWD_PATH || config.lnd_pwd_path,
        connect_ui: ENV.CONNECT_UI || config.connect_ui,
        proxy_macaroons_dir: ENV.PROXY_MACAROONS_DIR || config.proxy_macaroons_dir,
        proxy_tls_location: ENV.PROXY_TLS_LOCATION || config.proxy_tls_location,
        proxy_lnd_ip: ENV.PROXY_LND_IP || config.proxy_lnd_ip,
        proxy_lnd_port: ENV.PROXY_LND_PORT || config.proxy_lnd_port,
        proxy_admin_token: ENV.PROXY_ADMIN_TOKEN || config.proxy_admin_token,
        proxy_admin_url: ENV.PROXY_ADMIN_URL || config.proxy_admin_url,
    };
}
exports.loadConfig = loadConfig;
//# sourceMappingURL=config.js.map