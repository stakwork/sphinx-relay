"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseActionHistory = void 0;
const constants_1 = require("../constants");
function parseActionHistory(actions) {
    const actionTypes = Object.keys(constants_1.default.action_types);
    const parsedActions = {};
    actionTypes.forEach((action) => {
        parsedActions[action] = [];
    });
    actions.forEach((action) => {
        if (typeof JSON.parse(action.metaData) === 'object' &&
            typeof action.actionType === 'number') {
            if (action.actionType === 0) {
                const meta_data = JSON.parse(action.metaData);
                parsedActions[actionTypes[action.actionType]].push({
                    type: actionTypes[action.actionType],
                    meta_data: {
                        topics: meta_data.keywords,
                        current_timestamp: meta_data.current_timestamp,
                    },
                });
            }
            else if (action.actionType === 2) {
                const newMetaObject = Object.assign({}, JSON.parse(action.metaData));
                if (!newMetaObject.topics) {
                    newMetaObject.topics = [];
                }
                if (!newMetaObject.current_timestamp) {
                    newMetaObject.current_timestamp = newMetaObject.date
                        ? newMetaObject.date
                        : 0;
                }
                parsedActions[actionTypes[action.actionType]].push({
                    type: actionTypes[action.actionType],
                    meta_data: Object.assign({}, newMetaObject),
                });
            }
            else {
                parsedActions[actionTypes[action.actionType]].push({
                    type: actionTypes[action.actionType],
                    meta_data: JSON.parse(action.metaData),
                });
            }
        }
    });
    return parsedActions;
}
exports.parseActionHistory = parseActionHistory;
//# sourceMappingURL=feeds.js.map