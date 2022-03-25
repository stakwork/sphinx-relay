import {
  WebhookEvent,
  IssuesOpenedEvent,
  IssuesClosedEvent,
  IssuesReopenedEvent,
  PushEvent,
  CreateEvent,
  DeleteEvent,
  PullRequestClosedEvent,
  PullRequestOpenedEvent,
  ReleaseReleasedEvent,
} from '@octokit/webhooks-types'

// https://localtunnel.github.io/www/

// lt --port 8000

export type WebhookEventName =
  | 'push'
  | 'release'
  | 'commit_comment'
  | 'create'
  | 'delete'
  | 'discussion'
  | 'discussion_comment'
  | 'issue_comment'
  | 'issues'
  | 'label'
  | 'milestone'
  | 'project'
  | 'project_card'
  | 'project_column'
  | 'public'
  | 'pull_request'
  | 'pull_request_review'
  | 'pull_request_review_comment'
  | 'repository'
  | 'status'
export const all_webhook_events: WebhookEventName[] = [
  'push',
  'release',
  'commit_comment',
  'create', // A Git branch or tag is created
  'delete', // A Git branch or tag is deleted
  'discussion',
  'discussion_comment',
  'issue_comment',
  'issues',
  'label',
  'milestone',
  'project',
  'project_card',
  'project_column',
  'public', // A git repo is made public
  'pull_request',
  'pull_request_review',
  'pull_request_review_comment',
  'repository',
  'status', // When the status of a Git commit changes
]

type ActionMap = { [k: string]: (body: any) => string }
const issueActionMap: ActionMap = {
  closed: (e: IssuesClosedEvent) => {
    return `Issue #${e.issue.number} closed in ${e.repository.full_name}`
  },
  opened: (e: IssuesOpenedEvent) => {
    return `New issue in ${e.repository.full_name}: ${e.issue.title}`
  },
  reopened: (e: IssuesReopenedEvent) => {
    return `Issue #${e.issue.number} reopened in ${e.repository.full_name}`
  },
}
const prActionMap: ActionMap = {
  opened: (e: PullRequestOpenedEvent) => {
    return `New Pull Request opened in ${e.repository.full_name}: ${e.pull_request.title}`
  },
  closed: (e: PullRequestClosedEvent) => {
    return `Pull Request ${e.pull_request.number} in ${e.repository.full_name} closed`
  },
}
const releaseActions: ActionMap = {
  released: (e: ReleaseReleasedEvent) => {
    return `New Release in ${e.repository.full_name}! ${e.release.tag_name}`
  },
}
function pushAction(e: PushEvent): string {
  if (e.head_commit) {
    return `New commit in ${e.repository.full_name} by ${e.pusher.name}: ${e.head_commit.message}`
  } else {
    return ''
  }
}
function createAction(e: CreateEvent | DeleteEvent): string {
  if (e.ref_type === 'branch') {
    return `New branch created in ${e.repository.full_name}`
  } else if (e.ref_type === 'tag') {
    return `New tag created in ${e.repository.full_name}`
  } else {
    return ''
  }
}
const actionsMap: { [k in PropName]: ActionMap } = {
  issue: issueActionMap,
  pull_request: prActionMap,
  release: releaseActions,
}

// head_commit is for "push"
// "ref_type" = branch or tag. for "create"
type PropName = 'issue' | 'pull_request' | 'release'

const props: PropName[] = ['issue', 'pull_request', 'release']
export function process(event: WebhookEvent) {
  if ('head_commit' in event) {
    return pushAction(event)
  } else if ('ref_type' in event) {
    return createAction(event)
  }
  for (const prop of props) {
    if (prop in event) {
      if ('action' in event) {
        if (actionsMap[prop]) {
          if (actionsMap[prop][event.action]) {
            return actionsMap[prop][event.action](event)
          }
        }
      }
    }
  }
}
