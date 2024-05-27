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

    const webhookResponse = await axios.post<{
      runId: string
      webhookId: string
    }>(webhookUrl)
    core.debug(
      `Got response from webhook: ${JSON.stringify(webhookResponse?.data)}`
    )
    let counter = 0
    while (counter < 10) {
      // const url = `https://staging-hooks.montara.io/pipeline/run/status`
      const url = `https://staging-hooks.montara.io/pipeline/run/status?runId=717fe810-0a67-48f7-bb5e-a086da134082&webhookId=36a07953-feac-4de5-a2e8-fbcbe2373e57`
      core.debug(
        `Checking status of pipeline run with runId: ${webhookResponse?.data?.runId} and webhookId: ${webhookResponse?.data?.webhookId}`
      )
      const runStatus = await axios.get<{
        id: string
        status: PipelineRunStatus
      }>(url, {
        // params: {
        //   runId: webhookResponse?.data?.runId,
        //   webhookId: webhookResponse?.data?.webhookId
        // }
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
