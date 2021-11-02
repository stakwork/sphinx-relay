"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedJwtRoutes = exports.routes = exports.scopes = void 0;
var scopes;
(function (scopes) {
    scopes["PERSONAL"] = "personal";
    scopes["BOTS"] = "bots";
    scopes["SATS"] = "sats";
    scopes["TRIBE_ADMIN"] = "tribe_admin";
    scopes["MEME"] = "meme";
})(scopes = exports.scopes || (exports.scopes = {}));
exports.routes = {
    [scopes.PERSONAL]: ['/profile', '/public_pic', '/refresh_jwt'],
    [scopes.BOTS]: ['/bots', '/bot', '/bot/*'],
};
function allowedJwtRoutes(jwt, path) {
    const scopes = jwt.scope.split(',');
    let ok = false;
    scopes.forEach((sc) => {
        if (exports.routes[sc]) {
            // convert to regex with wildcards
            let rs = exports.routes[sc].map((r) => wildcardToRegExp(r));
            rs.forEach((r) => {
                if (path.match(r))
                    ok = true;
            });
        }
    });
    return ok;
}
exports.allowedJwtRoutes = allowedJwtRoutes;
function wildcardToRegExp(s) {
    return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$');
}
function regExpEscape(s) {
    return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}
//# sourceMappingURL=scopes.js.map