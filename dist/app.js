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
const bodyParser = require("body-parser");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const logger_1 = require("./src/utils/logger");
const hub_1 = require("./src/hub");
const setup_1 = require("./src/utils/setup");
const controllers = require("./src/controllers");
const connect = require("./src/utils/connect");
const socket = require("./src/utils/socket");
const network = require("./src/network");
const auth_1 = require("./src/auth");
const grpc = require("./src/grpc");
const cert = require("./src/utils/cert");
const config_1 = require("./src/utils/config");
const env = process.env.NODE_ENV || 'development';
const config = config_1.loadConfig();
const port = process.env.PORT || config.node_http_port || 3001;
console.log("=> env:", env);
// console.log('=> config: ',config)
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
// START SETUP!
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup_1.setupDatabase();
        mainSetup();
        if (config.hub_api_url) {
            hub_1.pingHubInterval(15000);
        }
    });
}
start();
function mainSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield setupApp(); // setup routes
        grpc.reconnectToLND(Math.random(), function () {
            console.log(">> FINISH SETUP");
            finishSetup();
        }); // recursive
    });
}
function finishSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield network.initTribesSubscriptions();
        if (config.hub_api_url) {
            hub_1.checkInvitesHubInterval(5000);
        }
        setup_1.setupDone();
    });
}
function setupApp() {
    return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const app = express();
        app.use(helmet());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(logger_1.default);
        app.use(cors({
            allowedHeaders: ['X-Requested-With', 'Content-Type', 'Accept', 'x-user-token']
        }));
        app.use(cookieParser());
        if (env != 'development') {
            app.use(auth_1.authModule);
        }
        app.use('/static', express.static('public'));
        app.get('/app', (req, res) => res.send('INDEX'));
        if (config.connect_ui) {
            app.get('/connect', connect.connect);
        }
        let server;
        if ('ssl' in config && config.ssl.enabled) {
            try {
                var certData = yield cert.getCertificate(config.public_url, config.ssl.port, config.ssl.save);
                var credentials = { key: (_a = certData) === null || _a === void 0 ? void 0 : _a.privateKey.toString(), ca: (_b = certData) === null || _b === void 0 ? void 0 : _b.caBundle, cert: (_c = certData) === null || _c === void 0 ? void 0 : _c.certificate };
                server = require("https").createServer(credentials, app);
            }
            catch (e) {
                console.log("getCertificate ERROR", e);
            }
        }
        else {
            server = require("http").Server(app);
        }
        if (!server)
            return console.log("=> FAILED to create server");
        server.listen(port, (err) => {
            if (err)
                throw err;
            /* eslint-disable no-console */
            console.log(`Node listening on ${port}.`);
        });
        // start all routes!
        if (!config.unlock) {
            controllers.set(app);
            socket.connect(server);
            resolve(true);
        }
        else {
            app.post('/unlock', function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    const ok = yield auth_1.unlocker(req, res);
                    if (ok) {
                        console.log('=> relay unlocked!');
                        controllers.set(app);
                        socket.connect(server);
                        resolve(true);
                    }
                });
            });
        }
    }));
}
//# sourceMappingURL=app.js.map