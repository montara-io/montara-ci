import * as core from '@actions/core'
import { wait } from './wait'

import {
  buildRunResultTemplate,
  buildRunStartedTemplate,
  getRunStatus,
  triggerPipelineFromWebhookUrl
} from './pipeline-run'
import {
  getPullRequestBranch,
  getPullRequestCommit,
  postComment
} from './github'
import { formatDuration } from './utils'
import { trackEvent } from './analytics'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    trackEvent({ eventName: 'montara_ciJobStarted' })
    const startTime = new Date().getTime()
    const webhookUrl: string = core.getInput('webhookUrl')
    const fallbackSchema: string = core.getInput('fallbackSchema')
    const isStaging: boolean = core.getInput('isStaging') === 'true'
    const numRetries = Number(core.getInput('numRetries')) || 60

    let isPipelineStartedCommentPosted = false

    core.info(
      `Montara GitHub Action is running with webhookUrl: ${webhookUrl}, fallbackSchema: ${fallbackSchema} and numRetries: ${numRetries}`
    )
    const branch = getPullRequestBranch()
    if (!branch) {
      core.setFailed('No pull request found in the context')
      return
    }
    const commit = getPullRequestCommit()
    if (!commit) {
      core.setFailed('No commit found in the context')
      return
    }

    core.info(
      `Trigger pipeline webhookUrl: ${webhookUrl}, for branch: ${branch} and commit: ${commit}`
    )

    const { runId, webhookId } = await triggerPipelineFromWebhookUrl({
      webhookUrl,
      branch,
      commit,
      fallbackSchema
    })

    core.info(`Pipeline run triggered with runId: ${runId}`)

    let counter = 0
    await wait(2000)
    while (counter < numRetries) {
      core.info(
        `Checking status of pipeline run with runId: ${runId} (Attempt: ${counter}/${numRetries})`
      )
      const {
        status,
        pipelineId,
        numFailed,
        numModels,
        numPassed,
        numSkipped
      } = await getRunStatus({
        runId,
        webhookId,
        isStaging
      })
      if (status === 'conflict') {
        core.setFailed(
          `There is an existing pipeline run in progress. Please wait for it to complete before triggering a new run.`
        )
        return
      }
      if (!isPipelineStartedCommentPosted) {
        core.info(`Pipeline run started`)
        await postComment({
          comment: buildRunStartedTemplate({
            isStaging,
            runId,
            pipelineId
          })
        })
        isPipelineStartedCommentPosted = true
      }
      if (['completed', 'failed', 'cancelled'].includes(status)) {
        core.info(`Pipeline run completed with status: ${status}`)
        await postComment({
          comment: buildRunResultTemplate({
            isPassing: status !== 'failed',
            isStaging,
            runId,
            pipelineId,
            numModels,
            numPassed,
            numFailed,
            numSkipped,
            runDuration: formatDuration(
              (new Date().getTime() - startTime) / 1000
            )
          })
        })
        if (status === 'completed' || status === 'cancelled') {
          core.debug(`Pipeline run completed with status: ${status}!`)
          trackEvent({
            eventName: 'montara_ciJobSuccess',
            eventProperties: {
              runId
            }
          })

          return
        } else if (status === 'failed') {
          trackEvent({
            eventName: 'montara_ciJobFailed',
            eventProperties: {
              runId
            }
          })

          core.setFailed(`Pipeline run failed`)
          return
        }
        counter = numRetries
      }
      await wait(10000)
      counter++
    }
    trackEvent({
      eventName: 'montara_ciJobFailed',
      eventProperties: {
        runId
      }
    })

    core.setFailed(`Pipeline run failed`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      const errorString = JSON.stringify(error)
      trackEvent({
        eventName: 'montara_ciJobRuntimeError',
        eventProperties: {
          error: errorString
        }
      })
      core.error(`Error occurred: ${errorString}`)
      core.setFailed(error.message)
    }
  }
}
