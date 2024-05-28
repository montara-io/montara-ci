import * as core from '@actions/core'
import { wait } from './wait'

import {
  buildRunResultTemplate,
  getRunStatus,
  triggerPipelineFromWebhookUrl
} from './pipeline-run'
import { postComment } from './github'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const webhookUrl: string = core.getInput('webhookUrl')
    const isStaging: boolean = core.getInput('isStaging') === 'true'
    const numRetries = Number(core.getInput('numRetries')) || 10

    const { runId, webhookId } = await triggerPipelineFromWebhookUrl(webhookUrl)
    let counter = 0
    await wait(2000)
    while (counter < numRetries) {
      core.debug(
        `Checking status of pipeline run with runId: ${runId} and webhookId: ${webhookId}. Attempt: ${counter}`
      )
      const { status, pipelineId } = await getRunStatus({
        runId,
        webhookId,
        isStaging
      })
      if (['completed', 'failed'].includes(status)) {
        await postComment({
          comment: buildRunResultTemplate({
            isPassing: status === 'completed',
            isStaging,
            runId,
            pipelineId
          })
        })
        if (status === 'completed') {
          core.debug(`Pipeline run completed successfully!`)
          core.setOutput('isPassing', true)
          break
        } else if (status === 'failed') {
          core.setOutput('isPassing', false)

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
