import * as core from '@actions/core'
import { wait } from './wait'
import axios from 'axios'

type PipelineRunStatus =
  | 'pending'
  | 'in_progress'
  | 'failed'
  | 'completed'
  | 'conflict'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const webhookUrl: string = core.getInput('webhookUrl')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Triggerring Montara pipeline with webhookUrl: ${webhookUrl}`)

    const {
      data: { runId, webhookId }
    } = await axios.post<{
      runId: string
      webhookId: string
    }>(webhookUrl)
    core.debug(
      `Pipeline triggered successfully with runId: ${runId} and webhookId: ${webhookId}`
    )
    let counter = 0
    await wait(2000)
    while (counter < 10) {
      const url = `https://staging-hooks.montara.io/pipeline/run/status`

      core.debug(
        `Checking status of pipeline run with runId: ${runId} and webhookId: ${webhookId}. Attempt: ${counter} with url ${url}`
      )
      const runStatus = await axios.get<{
        id: string
        status: PipelineRunStatus
      }>(url, {
        params: {
          runId,
          webhookId
        }
      })
      core.debug(
        `Got response from status check: ${JSON.stringify(runStatus.data)}`
      )
      if (runStatus.data.status === 'completed') {
        core.debug(`Pipeline run completed successfully!`)
        core.setOutput('isPassing', true)
        break
      } else if (runStatus.data.status === 'failed') {
        core.debug(
          `Pipeline run failed. Here is the response: ${JSON.stringify(runStatus.data)}`
        )
        core.setOutput('isPassing', false)
        core.setFailed(
          `Pipeline run failed with the following response: ${JSON.stringify(runStatus.data)}`
        )
        break
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
