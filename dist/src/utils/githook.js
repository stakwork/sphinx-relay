"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.process = exports.all_webhook_events = void 0;
exports.all_webhook_events = [
    'push',
    'release',
    'commit_comment',
    'create',
    'delete',
    'discussion',
    'discussion_comment',
    'issue_comment',
    'issues',
    'label',
    'milestone',
    'project',
    'project_card',
    'project_column',
    'public',
    'pull_request',
    'pull_request_review',
    'pull_request_review_comment',
    'repository',
    'status', // When the status of a Git commit changes
];
const issueActionMap = {
    closed: (e) => {
        return `Issue #${e.issue.number} closed in ${e.repository.full_name}`;
    },
    opened: (e) => {
        return `New issue in ${e.repository.full_name}: ${e.issue.title}`;
    },
    reopened: (e) => {
        return `Issue #${e.issue.number} reopened in ${e.repository.full_name}`;
    },
};
const prActionMap = {
    opened: (e) => {
        return `New Pull Request opened in ${e.repository.full_name}: ${e.pull_request.title}`;
    },
    closed: (e) => {
        return `Pull Request ${e.pull_request.number} in ${e.repository.full_name} closed`;
    },
};
const releaseActions = {
    released: (e) => {
        return `New Release in ${e.repository.full_name}! ${e.release.tag_name}`;
    },
};
function pushAction(e) {
    if (e.head_commit) {
        return `New commit in ${e.repository.full_name} by ${e.pusher.name}: ${e.head_commit.message}`;
    }
    else {
        return '';
    }
}
function createAction(e) {
    if (e.ref_type === 'branch') {
        return `New branch created in ${e.repository.full_name}`;
    }
    else if (e.ref_type === 'tag') {
        return `New tag created in ${e.repository.full_name}`;
    }
    else {
        return '';
    }
}
const actionsMap = {
    issue: issueActionMap,
    pull_request: prActionMap,
    release: releaseActions,
};
const props = ['issue', 'pull_request', 'release'];
function process(event, repo_filter) {
    var _a;
    if (repo_filter && 'repository' in event) {
        const fullname = (_a = event.repository) === null || _a === void 0 ? void 0 : _a.full_name.toLowerCase();
        if (fullname !== repo_filter.toLowerCase()) {
            // skip this altogether if the repo is not right
            return '';
        }
    }
    if ('head_commit' in event) {
        return pushAction(event);
    }
    else if ('ref_type' in event) {
        return createAction(event);
    }
    for (const prop of props) {
        if (prop in event) {
            if ('action' in event) {
                if (actionsMap[prop]) {
                    if (actionsMap[prop][event.action]) {
                        return actionsMap[prop][event.action](event);
                    }
                }
            }
        }
    }
    return '';
}
exports.process = process;
//# sourceMappingURL=githook.js.map