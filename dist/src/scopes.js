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
        '/profile'
    ],
};
function allowedJwtRoutes(jwt, path) {
    const ok = jwt.scopes.find(sc => {
        exports.routes[sc] && exports.routes[sc].includes(path);
    });
    return ok ? true : false;
}
exports.allowedJwtRoutes = allowedJwtRoutes;
//# sourceMappingURL=scopes.js.map