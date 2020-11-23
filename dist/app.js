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
const path = require("path");
const logger_1 = require("./src/utils/logger");
const hub_1 = require("./src/hub");
const setup_1 = require("./src/utils/setup");
const controllers = require("./src/controllers");
const socket = require("./src/utils/socket");
const network = require("./src/network");
const auth_1 = require("./src/auth");
const grpc = require("./src/grpc");
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, 'config/app.json'))[env];
const port = process.env.PORT || config.node_http_port || 3001;
console.log("=> env:", env);
console.log('=> process.env.PORT:', process.env.PORT);
console.log('=> config.node_http_port:', config.node_http_port);
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
// START SETUP!
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup_1.setupDatabase();
        connectToLND();
        hub_1.pingHubInterval(15000);
    });
}
start();
function connectToLND() {
    return __awaiter(this, void 0, void 0, function* () {
        grpc.reconnectToLND(Math.random(), function () {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(">> SETUP MAIN");
                yield mainSetup();
            });
        }); // recursive
    });
}
function mainSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield network.initTribesSubscriptions();
        if (config.hub_api_url) {
            // pingHubInterval(15000)
            hub_1.checkInvitesHubInterval(5000);
        }
        yield setupApp();
        setup_1.setupDone();
    });
}
function setupApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = express();
        const server = require("http").Server(app);
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
        }
        else {
            app.post('/unlock', function (req, res) {
                return __awaiter(this, void 0, void 0, function* () {
                    const ok = yield auth_1.unlocker(req, res);
                    if (ok) {
                        controllers.set(app);
                        socket.connect(server);
                    }
                });
            });
        }
    });
}
//# sourceMappingURL=app.js.map