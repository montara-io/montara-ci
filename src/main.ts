import * as core from '@actions/core'
import { wait } from './wait'

import { getRunStatus, triggerPipelineFromWebhookUrl } from './pipeline-run'
import { postComment } from './github'
import { PIPELINE_RUN_STATUS } from './comment-templates'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const webhookUrl: string = core.getInput('webhookUrl')

    const { runId, webhookId } = await triggerPipelineFromWebhookUrl(webhookUrl)
    let counter = 0
    await wait(2000)
    while (counter < 10) {
      core.debug(
        `Checking status of pipeline run with runId: ${runId} and webhookId: ${webhookId}. Attempt: ${counter}`
      )
      const { status, data } = await getRunStatus({ runId, webhookId })
      if (['pending', 'in_progress'].includes(status)) {
        await postComment({
          comment: PIPELINE_RUN_STATUS.replaceAll('{{status}}', status)
        })
        if (status === 'completed') {
          core.debug(`Pipeline run completed successfully!`)
          core.setOutput('isPassing', true)
          break
        } else if (status === 'failed') {
          core.debug(
            `Pipeline run failed. Here is the response: ${JSON.stringify(data)}`
          )
          core.setOutput('isPassing', false)
          core.setFailed(
            `Pipeline run failed with the following response: ${JSON.stringify(data)}`
          )

          break
        }
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
