import * as core from '@actions/core'
import { wait } from './wait'

import {
  buildRunResultTemplate,
  getRunStatus,
  triggerPipelineFromWebhookUrl
} from './pipeline-run'
import { postComment } from './github'
import { formatNumber } from './utils'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const startTime = new Date().getTime()
    const webhookUrl: string = core.getInput('webhookUrl')
    const isStaging: boolean = core.getInput('isStaging') === 'true'
    const numRetries = Number(core.getInput('numRetries')) || 10
    core.debug(
      `Montara GitHub Action is running with webhookUrl: ${webhookUrl}, isStaging: ${isStaging} and numRetries: ${numRetries}`
    )

    const { runId, webhookId } = await triggerPipelineFromWebhookUrl(webhookUrl)
    let counter = 0
    await wait(2000)
    while (counter < numRetries) {
      core.debug(
        `Checking status of pipeline run with runId: ${runId} and webhookId: ${webhookId}. Attempt: ${counter}/${numRetries}`
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
        core.setOutput('isPassing', false)
        core.setFailed(
          `There is an existing pipeline run in progress. Please wait for it to complete before triggering a new run.`
        )
      } else if (['completed', 'failed'].includes(status)) {
        await postComment({
          comment: buildRunResultTemplate({
            isPassing: status === 'completed',
            isStaging,
            runId,
            pipelineId,
            numModels,
            numPassed,
            numFailed,
            numSkipped,
            runDuration: formatNumber(new Date().getTime() - startTime)
          })
        })
        if (status === 'completed') {
          core.debug(`Pipeline run completed successfully!`)
          core.setOutput('isPassing', true)
          break
        } else if (status === 'failed') {
          core.setOutput('isPassing', false)
          core.setFailed(`Pipeline run failed`)

          break
        }
        counter = numRetries
      }
      await wait(10000)
      counter++
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.error(`Error occurred: ${JSON.stringify(error)}`)
      core.setFailed(error.message)
    }
  }
}
