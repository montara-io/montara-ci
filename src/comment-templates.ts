export const VIEW_FULL_RUN_DETAILS = `[View full run details in Montara](https://{{montaraPrefix}}.montara.io/app/pipelines/{{pipelineId}}?openModalRunId={{runId}})`

export const PIPELINE_RUN_STARTED = `
# Montara CI
☑️ Test run started

${VIEW_FULL_RUN_DETAILS}
`

export const PIPELINE_RUN_PENDING = `
# Montara CI
☑️ Set up a test environment for pipeline run
☑️ Test run waiting to start
`

export const PIPELINE_RUN_STATUS = `
# Montara CI report
☑️ Test run executed

:{{statusIcon}}: Test run {{status}}

## Run details

### Run duration
{{runDuration}}

### Models ({{numModels}})
- ✅  Passed - {{numPassed}}
- ❌  Failed - {{numFailed}}
- ⏸️  Skipped - {{numSkipped}}
`
