import * as github from '@actions/github'

export async function postComment({
  comment
}: {
  comment: string
}): Promise<void> {
  const octokit = github.getOctokit(process.env.MONTARA_GITHUB_TOKEN ?? '')
  const context = github.context
  const { pull_request, repository } = context.payload
  console.log('context payload', context.payload)

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
