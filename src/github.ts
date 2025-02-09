import * as github from '@actions/github'

export async function postComment({
  comment
}: {
  comment: string
}): Promise<void> {
  try {
    const commentToken: string = process.env.GITHUB_TOKEN ?? ''
    if (!commentToken) {
      console.log(
        'No GitHub token found in the context',
        process.env.GITHUB_TOKEN
      )

      return
    }
    const octokit = github.getOctokit(commentToken)
    const context = github.context
    const { pull_request, repository } = context.payload

    if (!pull_request) {
      console.log('No pull request found in the context')
      return
    }

    const prNumber = pull_request.number
    const owner = repository?.owner.login ?? ''
    const repo = repository?.name ?? ''

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment
    })

    console.debug('Comment posted successfully!')
  } catch (error) {
    console.log('Error posting comment:', error)
  }
}

export function getPullRequestBranch(): string {
  const context = github.context
  const { pull_request } = context.payload

  if (!pull_request?.head?.ref) {
    console.log('No pull request found in the context')
    return ''
  }

  return pull_request.head.ref
}

export function getPullRequestCommit(): string {
  const context = github.context
  const { pull_request } = context.payload

  if (!pull_request?.head?.sha) {
    console.log('No pull request found in the context')
    return ''
  }

  return pull_request.head.sha
}
