export const PIPELINE_RUN_STATUS = `
# Montara CI report
☑️ Set up a test environment for pipeline run
☑️ Test run executed

:{{statusIcon}}: test run {{status}}

## Run details

### Run duration
{{runDuration}}

### Models ({{numModels}})
- ✅  Passed - {{numPassed}}
- ❌  Failed - {{numFailed}}
- ⏸️  Skipped - {{numSkipped}}

[View full run details in Montara](https://{{montaraPrefix}}.montara.io/app/pipelines/{{pipelineId}}?openModalRunId={{runId}})
`
