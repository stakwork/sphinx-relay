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
var minimist = require('minimist');
var RNCryptor = require('jscryptor-2');
var fs = require('fs');
const argv = minimist(process.argv.slice(2));
const keyz = argv.keys;
const pin = argv.pin;
function go() {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = Buffer.from(keyz, 'base64').toString();
        const enc = keys.split('::')[1];
        const dec = RNCryptor.Decrypt(enc, pin + '').toString();
        const all = dec.split('::');
        const priv = all[0];
        const pub = all[1];
        const ip = all[2];
        const token = all[3];
        const r = yield fetch(ip + '/contacts', {
            headers: {
                'x-user-token': token,
            },
        });
        const j = yield r.json();
        const owner = j.response.contacts.find((c) => c.is_owner);
        console.log(JSON.stringify({
            pubkey: owner.public_key,
            ip: ip,
            authToken: token,
            contact_key: pub,
            privkey: priv,
            routeHint: owner.route_hint || '',
        }, null, 2));
        fs.writeFileSync('./stuff.json', JSON.stringify({
            pubkey: owner.public_key,
            ip: ip,
            authToken: token,
            contact_key: pub,
            privkey: priv,
            routeHint: owner.route_hint || '',
        }, null, 2));
    });
}
go();
//# sourceMappingURL=decodekeys.js.map