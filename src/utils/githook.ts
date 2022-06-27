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
  IssueCommentCreatedEvent,
  IssueCommentEditedEvent,
  IssueCommentDeletedEvent,
} from '@octokit/webhooks-types'

/*

https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads

### git bot

Make a place in Profile where user can add a Github Personal Access Token:

"Generate a Personal Access Token on github with the `repo` scope:"

POST /bot/git
{ "encrypted_pat": "xxx" } // encrypted with RSA key

*/

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

type ActionMap = { [k: string]: (body: WebhookEvent) => string }
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
const issueCommentActionMap: ActionMap = {
  created: (e: IssueCommentCreatedEvent) => {
    return `New comment on issue ${e.issue.number} created: ${trunc(
      e.comment.body
    )}`
  },
  edited: (e: IssueCommentEditedEvent) => {
    return `Edited comment on issue ${e.issue.number}`
  },
  deleted: (e: IssueCommentDeletedEvent) => {
    return `Deleted comment on issue ${e.issue.number}`
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

interface RefReturn {
  name: string
  kind: RefReturnKind // "branch" or "tag"
}
type RefReturnKind = 'branch' | 'tag'
function ref(inref: string): RefReturn | undefined {
  const refArray = inref.split('/')
  if (refArray.length < 3) return
  const branch = refArray[refArray.length - 1]
  const headsOrTags = refArray[refArray.length - 2]
  const labels: { [k: string]: RefReturnKind } = {
    heads: 'branch',
    tags: 'tag',
  }
  return <RefReturn>{
    name: branch,
    kind: labels[headsOrTags],
  }
}

function pushAction(e: PushEvent): string {
  if (e.head_commit) {
    const r = ref(e.ref)
    const refStr = r ? `(${r.name} ${r.kind}) ` : ''
    return `New commit in ${e.repository.full_name} ${refStr}by ${e.pusher.name}: ${e.head_commit.message}`
  } else {
    return ''
  }
}
function createAction(e: CreateEvent): string {
  if (e.ref_type === 'branch') {
    return `New branch created in ${e.repository.full_name}`
  } else if (e.ref_type === 'tag') {
    return `New tag created in ${e.repository.full_name}: ${e.ref}`
  } else {
    return ''
  }
}
function deleteAction(e: DeleteEvent): string {
  if (e.ref_type === 'branch') {
    return `New branch deleted in ${e.repository.full_name}`
  } else if (e.ref_type === 'tag') {
    return `New tag deleted in ${e.repository.full_name}: ${e.ref}`
  } else {
    return ''
  }
}
// this one needs to support every single event name
// const actionsMap: { [k in WebhookEventName]: ActionMap } = {
const actionsMap: { [k: string]: ActionMap } = {
  issues: issueActionMap,
  pull_request: prActionMap,
  release: releaseActions,
  issue_comment: issueCommentActionMap,
}

export function processGithook(
  event: WebhookEvent,
  event_name: WebhookEventName,
  repo_filter?: string
): string {
  if (repo_filter && 'repository' in event) {
    const fullname = event.repository?.full_name.toLowerCase()
    if (fullname !== repo_filter.toLowerCase()) {
      // skip this altogether if the repo is not right
      return ''
    }
  }
  if (event_name === 'push') {
    return pushAction(event as PushEvent)
  }
  if (event_name === 'create') {
    return createAction(event as CreateEvent)
  }
  if (event_name === 'delete') {
    return deleteAction(event as DeleteEvent)
  }
  if ('action' in event) {
    if (actionsMap[event_name]) {
      if (actionsMap[event_name][event.action]) {
        return actionsMap[event_name][event.action](event)
      }
    }
  }
  return ''
}

function trunc(str: string) {
  return truncateString(str, 100)
}
function truncateString(str: string, num: number) {
  if (str.length <= num) {
    return str
  }
  return str.slice(0, num) + '...'
}
