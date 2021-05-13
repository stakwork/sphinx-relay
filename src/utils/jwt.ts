import nJwt from 'njwt'
import * as secureRandom from 'secure-random'

// each restart of relay creates new key
// to revoke any JWT out in the wild, just restart relay
var signingKey = secureRandom(256, {type: 'Buffer'}); 

export function createJWT(ownerPubkey: string, minutes?:number) {
    const claims = {
        iss: "relay",
        pubkey: ownerPubkey,
    }
    var jwt = nJwt.create(claims,signingKey);
    const mins = minutes || 5
    jwt.setExpiration(new Date().getTime() + (mins*60*1000));
    return jwt.compact();
}

export function verifyJWT(token:string) {
    try {
        return nJwt.verify(token, signingKey);
    } catch(e){
        return false
    }
}