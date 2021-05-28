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
    [scopes.PERSONAL]: [
        '/profile',
        '/public_pic'
    ],
};
function allowedJwtRoutes(jwt, path) {
    const scopes = jwt.scope.split(',');
    let ok = false;
    scopes.forEach(sc => {
        if (exports.routes[sc] && exports.routes[sc].includes(path))
            ok = true;
    });
    return ok;
}
exports.allowedJwtRoutes = allowedJwtRoutes;
//# sourceMappingURL=scopes.js.map