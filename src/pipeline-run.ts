import * as core from '@actions/core'
import axios from 'axios'

type PipelineRunStatus =
  | 'pending'
  | 'in_progress'
  | 'failed'
  | 'completed'
  | 'conflict'

export async function triggerPipelineFromWebhookUrl(webhookUrl: string) {
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

  return { runId, webhookId }
}

export async function getRunStatus({
  runId,
  webhookId
}: {
  runId: string
  webhookId: string
}) {
  const url = `https://hooks.montara.io/pipeline/run/status`

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

  return { status: runStatus.data.status, data: runStatus.data }
}
