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
const crypto = require("crypto");
const path = require("path");
const models_1 = require("./api/models");
const logger_1 = require("./api/utils/logger");
const hub_1 = require("./api/hub");
const setup_1 = require("./api/utils/setup");
const controllers = require("./api/controllers");
const socket = require("./api/utils/socket");
const network = require("./api/network");
let server = null;
const port = process.env.PORT || 3001;
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, 'config/app.json'))[env];
process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';
var i = 0;
// START SETUP!
connectToLND();
function connectToLND() {
    return __awaiter(this, void 0, void 0, function* () {
        i++;
        console.log(`=> [lnd] connecting... attempt #${i}`);
        try {
            yield network.initGrpcSubscriptions(); // LND
            yield mainSetup(); // DB + express
            yield network.initTribesSubscriptions(); // MQTT
        }
        catch (e) {
            if (e.details) {
                console.log(`=> [lnd] error details: ${e.details}`);
            }
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                yield connectToLND();
            }), 2000);
        }
    });
}
function mainSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield setup_1.setupDatabase();
        if (config.hub_api_url) {
            hub_1.pingHubInterval(5000);
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
        app.options('*', (req, res) => res.send(200));
        app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
            res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            res.setHeader('Expires', '-1');
            res.setHeader('Pragma', 'no-cache');
            next();
        });
        app.use(cookieParser());
        if (env != 'development') {
            app.use(authModule);
        }
        app.use('/static', express.static('public'));
        app.get('/app', (req, res) => res.sendFile(__dirname + '/public/index.html'));
        server.listen(port, (err) => {
            if (err)
                throw err;
            /* eslint-disable no-console */
            console.log(`Node listening on ${port}.`);
        });
        controllers.set(app);
        socket.connect(server);
    });
}
function authModule(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.path == '/app' ||
            req.path == '/' ||
            req.path == '/info' ||
            req.path == '/contacts/tokens' ||
            req.path == '/login' ||
            req.path.startsWith('/static') ||
            req.path == '/contacts/set_dev') {
            next();
            return;
        }
        if (process.env.HOSTING_PROVIDER === 'true') {
            // const domain = process.env.INVITE_SERVER
            const host = req.headers.origin;
            console.log('=> host:', host);
            const referer = req.headers.referer;
            console.log('=> referer:', referer);
            if (req.path === '/invoices') {
                next();
                return;
            }
        }
        const token = req.headers['x-user-token'] || req.cookies['x-user-token'];
        if (token == null) {
            res.writeHead(401, 'Access invalid for user', { 'Content-Type': 'text/plain' });
            res.end('Invalid credentials');
        }
        else {
            const user = yield models_1.models.Contact.findOne({ where: { isOwner: true } });
            const hashedToken = crypto.createHash('sha256').update(token).digest('base64');
            if (user.authToken == null || user.authToken != hashedToken) {
                res.writeHead(401, 'Access invalid for user', { 'Content-Type': 'text/plain' });
                res.end('Invalid credentials');
            }
            else {
                next();
            }
        }
    });
}
exports.default = server;
//# sourceMappingURL=app.js.map