import * as core from '@actions/core'
import { DbtRunErrors } from '@montara-io/error-parsing'
import axios from 'axios'
import { PIPELINE_RUN_STARTED, PIPELINE_RUN_STATUS } from './comment-templates'

// eslint-disable-next-line no-shadow
export enum ModelRunStatus {
  Success = 'success',
  Error = 'error',
  Skipped = 'skipped'
}
// eslint-disable-next-line no-shadow
enum RunEnvironment {
  Staging = 'Staging',
  Production = 'Production',
  CI = 'CI'
}

type PipelineErrors = {
  generalErrors: {
    type: string
    message: string
  }[]
}

type GetPipelineRunStatus = {
  id: string
  status: PipelineRunStatus
  pipelineId: string
  errors: DbtRunErrors
  modelRunDetails: {
    name: string
    owner: {
      id: string
      email: string
    }
    lastUpdatedOn: Date
    lastUpdatedBy: {
      id: string
      email: string
    }
    runEnvironment: RunEnvironment
    status: ModelRunStatus
    error: string
    executionTime: number
    rowsAffected?: number
  }[]
}

type PipelineRunStatus =
  | 'pending'
  | 'in_progress'
  | 'failed'
  | 'completed'
  | 'conflict'
  | 'cancelling'
  | 'cancelled'

export async function triggerPipelineFromWebhookUrl({
  webhookUrl,
  branch,
  commit,
  fallbackSchema,
  isSmartRun,
  allowConcurrentPipelineRuns
}: {
  webhookUrl: string
  branch: string
  commit: string
  fallbackSchema: string
  isSmartRun: boolean
  allowConcurrentPipelineRuns: boolean
}): Promise<{
  runId: string
  webhookId: string
}> {
  // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
  core.debug(
    `Triggerring Montara pipeline with webhookUrl: ${webhookUrl}, branch: ${branch} and commit: ${commit}, fallbackSchema: ${fallbackSchema}, isSmartRun: ${isSmartRun}, allowConcurrentPipelineRuns: ${allowConcurrentPipelineRuns}`
  )

  const {
    data: { runId, webhookId }
  } = await axios.post<{
    runId: string
    webhookId: string
  }>(webhookUrl, {
    branch,
    commit,
    runEnvironment: RunEnvironment.CI,
    fallbackSchema,
    isSmartRun,
    allowConcurrentPipelineRuns
  })
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
  pipelineId: string
  numModels: number
  numPassed: number
  numFailed: number
  numSkipped: number
  errors: PipelineErrors
}> {
  const url = `https://${isStaging ? 'staging-' : ''}hooks.montara.io/pipeline/run/status`

  const runStatus = await axios.get<GetPipelineRunStatus>(url, {
    params: {
      runId,
      webhookId
    }
  })

  core.debug(`Pipeline run status response: ${JSON.stringify(runStatus?.data)}`)
  const numModels = runStatus?.data?.modelRunDetails?.length ?? 0
  const numPassed =
    runStatus?.data?.modelRunDetails?.filter(
      model => model.status === ModelRunStatus.Success
    ).length ?? 0
  const numFailed =
    runStatus?.data?.modelRunDetails?.filter(
      model => model.status === ModelRunStatus.Error
    ).length ?? 0
  const numSkipped =
    runStatus?.data?.modelRunDetails?.filter(
      model => model.status === ModelRunStatus.Skipped
    ).length ?? 0
  return {
    status: runStatus.data.status,
    pipelineId: runStatus.data.pipelineId,
    numModels,
    numPassed,
    numFailed,
    numSkipped,
    errors: runStatus.data.errors
  }
}

export function buildRunStartedTemplate({
  isStaging,
  runId,
  pipelineId
}: {
  isStaging: boolean
  runId: string
  pipelineId: string
}): string {
  const templateVariableToValue = {
    runId,
    pipelineId,
    montaraPrefix: isStaging ? 'staging' : 'app'
  }

  let result = PIPELINE_RUN_STARTED

  for (const [key, value] of Object.entries(templateVariableToValue)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }

  return result
}

export function buildRunResultTemplate({
  status,
  isStaging,
  runId,
  pipelineId,
  runDuration,
  numModels,
  numPassed,
  numFailed,
  numSkipped
}: {
  status: PipelineRunStatus
  isStaging: boolean
  runId: string
  pipelineId: string
  runDuration: string
  numModels: number
  numPassed: number
  numFailed: number
  numSkipped: number
}): string {
  let statusText: string
  switch (status) {
    case 'completed':
      statusText = 'completed successfully'
      break
    case 'failed':
      statusText = 'failed'
      break
    case 'cancelled':
      statusText = 'cancelled'
      break
    default:
      statusText = 'unknown'
      break
  }

  const templateVariableToValue = {
    statusIcon:
      status === 'completed'
        ? 'white_check_mark'
        : status === 'cancelled'
          ? 'warning'
          : 'x', //for failed
    status: statusText,
    runId,
    pipelineId,
    montaraPrefix: isStaging ? 'staging' : 'app',
    runDuration,
    numModels: numModels.toString(),
    numPassed: numPassed.toString(),
    numFailed: numFailed.toString(),
    numSkipped: numSkipped.toString()
  }

  let result = PIPELINE_RUN_STATUS

  for (const [key, value] of Object.entries(templateVariableToValue)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }

  return result
}
