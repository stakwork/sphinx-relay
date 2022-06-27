"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processGithook = exports.all_webhook_events = void 0;
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
const issueCommentActionMap = {
    created: (e) => {
        return `New comment on issue #${e.issue.number} (${e.repository.full_name}): ${trunc(e.comment.body)}`;
    },
    edited: (e) => {
        return `Edited comment on issue #${e.issue.number} (${e.repository.full_name})`;
    },
    deleted: (e) => {
        return `Deleted comment on issue #${e.issue.number} (${e.repository.full_name})`;
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
function ref(inref) {
    const refArray = inref.split('/');
    if (refArray.length < 3)
        return;
    const branch = refArray[refArray.length - 1];
    const headsOrTags = refArray[refArray.length - 2];
    const labels = {
        heads: 'branch',
        tags: 'tag',
    };
    return {
        name: branch,
        kind: labels[headsOrTags],
    };
}
function pushAction(e) {
    if (e.head_commit) {
        const r = ref(e.ref);
        const refStr = r ? `(${r.name} ${r.kind}) ` : '';
        return `New commit in ${e.repository.full_name} ${refStr}by ${e.pusher.name}: ${e.head_commit.message}`;
    }
    else {
        return '';
    }
}
function createAction(e) {
    if (e.ref_type === 'branch') {
        const r = ref(e.ref);
        const branchName = r ? r.name : '';
        return `New branch created in ${e.repository.full_name}: ${branchName}`;
    }
    else if (e.ref_type === 'tag') {
        return `New tag created in ${e.repository.full_name}: ${e.ref}`;
    }
    else {
        return '';
    }
}
function deleteAction(e) {
    if (e.ref_type === 'branch') {
        const r = ref(e.ref);
        const branchName = r ? r.name + ' ' : '';
        return `Branch ${branchName}deleted in ${e.repository.full_name}`;
    }
    else if (e.ref_type === 'tag') {
        return `Tag deleted in ${e.repository.full_name}: ${e.ref}`;
    }
    else {
        return '';
    }
}
// this one needs to support every single event name
// const actionsMap: { [k in WebhookEventName]: ActionMap } = {
const actionsMap = {
    issues: issueActionMap,
    pull_request: prActionMap,
    release: releaseActions,
    issue_comment: issueCommentActionMap,
};
function processGithook(event, event_name, repo_filter) {
    var _a;
    if (repo_filter && 'repository' in event) {
        const fullname = (_a = event.repository) === null || _a === void 0 ? void 0 : _a.full_name.toLowerCase();
        if (fullname !== repo_filter.toLowerCase()) {
            // skip this altogether if the repo is not right
            return '';
        }
    }
    if (event_name === 'push') {
        return pushAction(event);
    }
    if (event_name === 'create') {
        return createAction(event);
    }
    if (event_name === 'delete') {
        return deleteAction(event);
    }
    if ('action' in event) {
        if (actionsMap[event_name]) {
            if (actionsMap[event_name][event.action]) {
                return actionsMap[event_name][event.action](event);
            }
        }
    }
    return '';
}
exports.processGithook = processGithook;
function trunc(str) {
    return truncateString(str, 100);
}
function truncateString(str, num) {
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + '...';
}
//# sourceMappingURL=githook.js.map