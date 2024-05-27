import * as core from '@actions/core'
import axios from 'axios'
import { PIPELINE_RUN_STATUS } from './comment-templates'

type PipelineRunStatus =
  | 'pending'
  | 'in_progress'
  | 'failed'
  | 'completed'
  | 'conflict'

export async function triggerPipelineFromWebhookUrl(
  webhookUrl: string
): Promise<{
  runId: string
  webhookId: string
}> {
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
  webhookId,
  isStaging
}: {
  runId: string
  webhookId: string
  isStaging: boolean
}): Promise<{
  status: PipelineRunStatus
  data: {
    id: string
    status: PipelineRunStatus
  }
}> {
  const url = `https://${isStaging ? 'staging-' : ''}hooks.montara.io/pipeline/run/status`

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

  return {
    status: runStatus.data.status,
    data: runStatus.data
  }
}

export function buildRunResultTemplate({
  isPassing,
  isStaging,
  runId,
  pipelineId
}: {
  isPassing: boolean
  isStaging: boolean
  runId: string
  pipelineId: string
}): string {
  const templateVariableToValue = {
    status_icon: isPassing ? 'cross' : 'check',
    status: 'failed',
    run_id: runId,
    pipeline_id: pipelineId,
    montara_prefix: isStaging ? 'staging' : 'app'
  }

  let result = PIPELINE_RUN_STATUS

  for (const [key, value] of Object.entries(templateVariableToValue)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }

  return result
}
