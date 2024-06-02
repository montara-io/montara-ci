import * as github from '@actions/github'
import * as core from '@actions/core'

export async function postComment({
  comment
}: {
  comment: string
}): Promise<void> {
  const commentToken: string = core.getInput('commentToken')
  if (!commentToken) {
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

  console.log('Comment posted successfully!')
}
