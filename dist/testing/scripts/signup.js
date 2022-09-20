var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var fetch = require('node-fetch');
var crypto = require('crypto');
var minimist = require('minimist');
var rsa = require('./rsa');
const argv = minimist(process.argv.slice(2));
const pubkey = argv.pubkey;
const port = argv.port || '3004'; // proxy by default
const relayURL = 'http://localhost:' + port + '/';
/*
node ./signup --pubkey=XXX --port=3004
*/
function signup(pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('SIGNUP AS', pubkey);
        const token = crypto.randomBytes(20).toString('hex').toUpperCase();
        const body = {
            token: token,
            pubkey: pubkey,
        };
        const r = yield fetch(relayURL + 'contacts/tokens', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        });
        const j = yield r.json();
        console.log('j', j);
        const ownerID = j.response.id;
        if (!ownerID)
            return console.log('FAIL');
        const keys = yield rsa.genKeys();
        const contact_key = keys.public;
        console.log('PROXY NODE:', {
            pubkey,
            authToken: token,
            contact_key,
            privkey: keys.private,
        });
        const r3 = yield fetch(relayURL + 'contacts/' + ownerID, {
            method: 'PUT',
            body: JSON.stringify({ contact_key }),
            headers: { 'Content-Type': 'application/json', 'x-user-token': token },
        });
        const j3 = yield r3.json();
        console.log(j3);
    });
}
if (pubkey) {
    signup(pubkey);
}
//# sourceMappingURL=signup.js.map