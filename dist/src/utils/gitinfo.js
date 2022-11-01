"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tag = exports.commitHash = void 0;
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
function git(command) {
    try {
        return child_process_1.execSync(`git ${command}`).toString().trim();
    }
    catch (e) {
        logger_1.sphinxLogger.error('Error running a git command, probably not running in a git repository');
        logger_1.sphinxLogger.error(e);
    }
}
exports.commitHash = git('log -1 --pretty=format:%h') || '';
exports.tag = git('describe --abbrev=0 --tags') || '';
//# sourceMappingURL=gitinfo.js.map