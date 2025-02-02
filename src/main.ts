import * as core from '@actions/core'
import { wait } from './wait'

import { trackEvent } from './analytics'
import {
  getPullRequestBranch,
  getPullRequestCommit,
  postComment
} from './github'
import {
  buildRunPendingTemplate,
  buildRunResultTemplate,
  buildRunStartedTemplate,
  getRunStatus,
  triggerPipelineFromWebhookUrl
} from './pipeline-run'
import { formatDuration } from './utils'

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
    const isSmartRunParam: string = core.getInput('isSmartRun')
    const variables: string = core.getInput('variables')
    const isSmartRun: boolean = isSmartRunParam
      ? isSmartRunParam === 'true'
      : true
    const allowConcurrentPipelineRunsParam: string = core.getInput(
      'allowConcurrentPipelineRuns'
    )
    let dbtVariables: Record<string, string> | undefined
    if (variables?.trim()) {
      dbtVariables = parseVariables(variables)
      if (!dbtVariables) {
        return
      }
      core.info(`using dbtVariables: ${JSON.stringify(dbtVariables)}`)
    }

    const allowConcurrentPipelineRuns: boolean =
      allowConcurrentPipelineRunsParam
        ? allowConcurrentPipelineRunsParam === 'true'
        : true
    const numRetries = Number(core.getInput('numRetries')) || 60

    let isPipelineStartedCommentPosted = false
    let isPipelinePendingCommentPosted = false

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
      fallbackSchema,
      isSmartRun,
      allowConcurrentPipelineRuns,
      dbtVariables
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
        cancelledReason,
        pipelineId,
        numFailed,
        numModels,
        numPassed,
        numSkipped,
        errors
      } = await getRunStatus({
        runId,
        webhookId,
        isStaging
      })
      if (status === 'in_progress' && !isPipelineStartedCommentPosted) {
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
      if (status === 'pending' && !isPipelinePendingCommentPosted) {
        core.info(`Pipeline run pending`)
        await postComment({
          comment: buildRunPendingTemplate()
        })
        isPipelinePendingCommentPosted = true
      }
      if (['completed', 'failed', 'cancelled'].includes(status)) {
        core.info(`Pipeline run completed with status: ${status}`)
        await postComment({
          comment: buildRunResultTemplate({
            status,
            isStaging,
            runId,
            pipelineId,
            numModels,
            numPassed,
            numFailed,
            numSkipped,
            errors,
            runDuration: formatDuration(
              (new Date().getTime() - startTime) / 1000
            )
          })
        })
        core.debug(`Pipeline run completed with status: ${status}!`)
        if (status === 'completed') {
          trackEvent({
            eventName: 'montara_ciJobSuccess',
            eventProperties: {
              runId
            }
          })

          return
        } else if (status === 'cancelled') {
          const errorString = errors?.generalErrors?.length
            ? errors.generalErrors[0]?.message
            : JSON.stringify(errors)
          core.debug(`errorString: ${errorString}`)
          core.warning(`Pipeline run canceled with reason: ${cancelledReason}`)

          if (cancelledReason === 'Conflict') {
            core.setFailed(
              `There is an existing pipeline run in progress. Please wait for it to complete before triggering a new run.`
            )
            return
          } else if (cancelledReason === 'MissingTargetInfo') {
            core.setFailed(
              `Missing target info. Please add target info to the pipeline.`
            )
            return
          } else if (cancelledReason === 'UserCancelled') {
            core.setFailed(
              `Pipeline run cancelled by user. Please check the pipeline run status.`
            )
            return
          }

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

function parseVariables(variables: string): Record<string, string> | undefined {
  try {
    const parsed = JSON.parse(variables)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      // Validate all keys and values are strings
      const isValid = Object.entries(parsed).every(
        ([key, value]) => typeof key === 'string' && typeof value === 'string'
      )
      if (isValid) {
        return parsed
      } else {
        core.setFailed(
          'Variables must be a dictionary of string keys to string values'
        )
        return undefined
      }
    } else {
      core.setFailed(
        'Variables must be a dictionary of string keys to string values'
      )
      return undefined
    }
  } catch (error) {
    core.setFailed(
      `'Variables must be a dictionary of string keys to string values': ${error}`
    )
    return undefined
  }
}
