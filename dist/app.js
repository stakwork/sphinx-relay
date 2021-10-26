"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const logger_1 = require("./src/utils/logger");
const hub_1 = require("./src/hub");
const proxy_1 = require("./src/utils/proxy");
const setup_1 = require("./src/utils/setup");
const controllers = require("./src/controllers");
const connect = require("./src/utils/connect");
const socket = require("./src/utils/socket");
const network = require("./src/network");
const auth_1 = require("./src/auth");
const grpc = require("./src/grpc/subscribe");
const cert = require("./src/utils/cert");
const config_1 = require("./src/utils/config");
const env = process.env.NODE_ENV || 'development';
const config = (0, config_1.loadConfig)();
const port = process.env.PORT || config.node_http_port || 3001;
console.log('=> env:', env);
// console.log('=> config: ',config)
process.env.GRPC_SSL_CIPHER_SUITES =
    'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384';
process.env.NODE_EXTRA_CA_CERTS = config.tls_location;
// START SETUP!
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, setup_1.setupDatabase)();
        mainSetup();
        // // IF NOT UNLOCK, go ahead and start this now
        if (config.hub_api_url && !config.unlock) {
            (0, hub_1.pingHubInterval)(30000);
            (0, proxy_1.genUsersInterval)(15000);
        }
    });
}
start();
function mainSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield setupApp(); // setup routes
        grpc.reconnectToLightning(Math.random(), function () {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('>>> FINISH SETUP');
                yield finishSetup();
                app.get('/is_setup', (req, res) => res.send(true));
            });
        }); // recursive
    });
}
function finishSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, setup_1.setupOwnerContact)();
        yield network.initTribesSubscriptions();
        if (config.hub_api_url) {
            (0, hub_1.checkInvitesHubInterval)(5000);
        }
        if (config.unlock) {
            // IF UNLOCK, start this only after unlocked!
            (0, hub_1.pingHubInterval)(15000);
        }
        (0, setup_1.setupDone)();
    });
}
function setupApp() {
    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
        const app = express();
        app.use(helmet());
        app.use(express.json({ limit: '5MB' }));
        app.use(express.urlencoded());
        if (logger_1.logging.Express) {
            app.use(logger_1.default);
        }
        app.use(cors({
            allowedHeaders: [
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'x-user-token',
                'x-jwt',
            ],
        }));
        app.use(cookieParser());
        app.use(auth_1.ownerMiddleware);
        app.use('/static', express.static('public'));
        app.get('/app', (req, res) => res.send('INDEX'));
        if (config.connect_ui) {
            app.get('/connect', connect.connect);
            app.post('/gen_channel', connect.genChannel);
            app.post('/connect_peer', connect.connectPeer);
            app.get('/peered', connect.checkPeered);
        }
        let server;
        if ('ssl' in config && config.ssl.enabled) {
            try {
                const certData = yield cert.getCertificate(config.public_url, config.ssl.port, config.ssl.save);
                const credentials = {
                    key: certData === null || certData === void 0 ? void 0 : certData.privateKey.toString(),
                    ca: certData === null || certData === void 0 ? void 0 : certData.caBundle,
                    cert: certData === null || certData === void 0 ? void 0 : certData.certificate,
                };
                server = require('https').createServer(credentials, app);
            }
            catch (e) {
                console.log('getCertificate ERROR', e);
            }
        }
        else {
            server = require('http').Server(app);
        }
        if (!server)
            return console.log('=> FAILED to create server');
        server.listen(port, (err) => {
            if (err)
                throw err;
            /* eslint-disable no-console */
            console.log(`Node listening on ${port}.`);
        });
        // process.on('SIGTERM', () => {
        //   server.close(function () {
        //     process.exit(0)
        //   })
        // })
        // process.on('exit', () => {
        //   server.close(function () {
        //     process.exit(0)
        //   })
        // })
        // start all routes!
        if (!config.unlock) {
            controllers.set(app);
            socket.connect(server);
            resolve(app);
        }
        else {
            app.post('/unlock', function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    const ok = yield (0, auth_1.unlocker)(req, res);
                    if (ok) {
                        console.log('=> relay unlocked!');
                        controllers.set(app);
                        socket.connect(server);
                        resolve(app);
                    }
                });
            });
        }
    }));
}
//# sourceMappingURL=app.js.map