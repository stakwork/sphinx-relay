"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseActionHistory = void 0;
const constants_1 = require("../constants");
function parseActionHistory(actions) {
    const actionTypes = Object.keys(constants_1.default.action_types);
    const parsedActions = [];
    actions.forEach((action) => {
        parsedActions.push({
            type: actionTypes[action.actionType],
            meta_data: JSON.parse(action.metaData),
        });
    });
    return parsedActions.reverse();
}
exports.parseActionHistory = parseActionHistory;
//# sourceMappingURL=feeds.js.map