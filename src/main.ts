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
    core.debug(`Response: ${JSON.stringify(webhookResponse)}`)
    const counter = 0
    while (counter < 10) {
      const runStatus = await axios.get<{
        id: string
        status: PipelineRunStatus
      }>(
        `https://hooks.montara.io/pipeline/run/status?runId=${webhookResponse?.data?.runId}`
      )
      if (runStatus.data.status === 'completed') {
        core.setOutput('isPassing', true)
        break
      } else if (runStatus.data.status === 'failed') {
        core.setOutput('isPassing', false)
        break
      }
      await wait(1000)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
