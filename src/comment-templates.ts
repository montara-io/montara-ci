export const PIPELINE_RUN_STATUS = `
# Montara CI report
☑️ Set up a test environment for pipeline run
☑️ Test run executed

:{{statusIcon}}: test run {{status}}

## Run details

### Run duration
{{runDuration}}

### Models ({{numNodels}})
- ✅  Passed - {{numPassed}}
- ❌  Failed - {{numFailed}}
- ⏸️  Skipped - {{numSkipped}}

[View full run details in Montara](https://{{montaraPrefix}}.montara.io/app/pipelines/{{pipelineId}}?openModalRunId={{runId}})
`

// # Montara CI report
// ☑️ Set up a test environment for pipeline run
// ☑️ Test run executed

// :x: test run failed / completed successfully

// ## Run details

// ### Run duration
// 4 minutes

// ### Models (80)
// - ✅  Passed - 72
// - ❌  Failed - 8
// - ⏸️  Skipped - 3

// [View full run details in Montara](https://staging.montara.io/app/pipelines/47300c8c-8be3-443c-8a16-4ac09bdb98bc?openModalRunId=9c28a51a-591a-403f-8e14-b7fc6380e2c2)
