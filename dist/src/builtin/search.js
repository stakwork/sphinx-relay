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
exports.settleLsat = exports.init = void 0;
const Sphinx = require("sphinx-bot");
const logger_1 = require("../utils/logger");
const botapi_1 = require("../controllers/botapi");
const models_1 = require("../models");
const node_fetch_1 = require("node-fetch");
const msg_types = Sphinx.MSG_TYPE;
let initted = false;
function init() {
    if (initted)
        return;
    initted = true;
    const client = new Sphinx.Client();
    client.login('_', botapi_1.finalAction);
    client.on(msg_types.MESSAGE, (message) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!message.content)
            return;
        const arr = message.content.split(' ');
        if (arr.length < 3)
            return;
        if (arr[0] !== '/search')
            return;
        const cmd = arr[1];
        try {
            const tribe = (yield models_1.models.Chat.findOne({
                where: { uuid: message.channel.id },
            }));
            switch (cmd) {
                case 'search':
                    const graphs = (yield models_1.models.GraphSubscription.findAll());
                    const searchWord = `${arr.slice(1, arr.length).join(' ')}`;
                    const subscriptions = yield settleLsat(graphs, searchWord);
                    const request = {
                        company_name: 'Sphinx',
                        tribe_name: tribe.name,
                        search_word: searchWord,
                        subscriptions,
                    };
                    const response = yield (0, node_fetch_1.default)('http://3.95.131.14:5000/prediction/query', {
                        method: 'POST',
                        body: JSON.stringify(request),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    if (response.ok) {
                        const parsedRes = yield response.json();
                        let internalRes = [];
                        if ((_a = parsedRes.internal) === null || _a === void 0 ? void 0 : _a.exact) {
                            internalRes = (_b = parsedRes.internal) === null || _b === void 0 ? void 0 : _b.exact.slice(0, 5);
                        }
                        let externalRes = [];
                        if (parsedRes.external.exact) {
                            externalRes = (_c = parsedRes.external) === null || _c === void 0 ? void 0 : _c.exact.slice(0, 5);
                        }
                        let returnMsg = '';
                        for (let i = 0; i < internalRes.length; i++) {
                            const result = internalRes[i];
                            returnMsg = `${returnMsg} ${result === null || result === void 0 ? void 0 : result.description} from ${result === null || result === void 0 ? void 0 : result.show_title} \n`;
                        }
                        for (let i = 0; i < externalRes.length; i++) {
                            const result = externalRes[i];
                            returnMsg = `${returnMsg} ${result.description} from ${result.show_title} \n`;
                        }
                        if (!returnMsg) {
                            returnMsg = 'No result found for your search';
                        }
                        const resEmbed = new Sphinx.MessageEmbed()
                            .setAuthor('SearchBot')
                            .setDescription(returnMsg);
                        message.channel.send({ embed: resEmbed });
                        return;
                    }
                    else {
                        const resEmbed = new Sphinx.MessageEmbed()
                            .setAuthor('SearchBot')
                            .setDescription(`Sorry seems there is an issue with your internal private graph ${response.status}`);
                        message.channel.send({ embed: resEmbed });
                        return;
                    }
                case 'graph':
                    if (arr.length !== 4)
                        return;
                    const name = arr[2];
                    const address = arr[3];
                    yield models_1.models.GraphSubscription.create({
                        name,
                        address,
                        status: 1,
                        tenant: message.member.id,
                        chatIds: JSON.stringify([tribe.id]),
                    });
                    const resEmbed = new Sphinx.MessageEmbed()
                        .setAuthor('SearchBot')
                        .setDescription(`Graph Subscription was added successfully`);
                    message.channel.send({ embed: resEmbed });
                    return;
            }
        }
        catch (error) {
            logger_1.sphinxLogger.error(`SEARCH BOT ERROR ${error}`, logger_1.logging.Bots);
        }
    }));
}
exports.init = init;
function settleLsat(graphs, word) {
    return __awaiter(this, void 0, void 0, function* () {
        const newGraphs = [];
        for (let i = 0; i < graphs.length; i++) {
            const graph = graphs[i];
            // const lsat = (await models.Lsat.findOne({
            //   where: { paths: graph.address, status: 1 },
            // })) as Lsat
            const obj = {
                client_name: graph.name,
                prediction_endpoint: `${graph.address}?word=${word}`,
                //Correct Implementation
                //   lsat: lsat ? `LSAT ${lsat.macaroon}:${lsat.preimage}` : '',
                lsat: `LSAT AgEba25vd2xlZGdlLWdyYXBoLnNwaGlueC5jaGF0AoQBMDAwMGMzN2QzNjI0NTM3YmVkY2UxZThmYTdmM2Y5ZmVkNDYyMTU2MWJiMmJmODY2YWMzYjMzZmM1NDVjNmY3NjE3NzFhZWU5YmZlYzljOTRhMDI2MDU5ZWZlMzk2MTllNDVkY2Q1YWQ5OWI1Y2JjZDA4MzdlNDUzMjM5OGNiMmQyNjFiAAAGIIB-8uA1VZ5gb1rNaRjjFPfBqlF16JnnQd1fK-VuwebL:cb8779ec0e386c62acc88c409f0730707e643e306678b15018676177c7d336f9`,
            };
            newGraphs.push(obj);
        }
        return newGraphs;
    });
}
exports.settleLsat = settleLsat;
//# sourceMappingURL=search.js.map