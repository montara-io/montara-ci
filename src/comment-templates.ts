export const PIPELINE_RUN_STATUS = `
# Montara CI report

:{{status_icon}}: pipeline finished with status {{status}}

[View run in Montara](https://{{montara_prefix}}.montara.io/app/pipelines/{{pipeline_id}}&openModalRunId={{run_id}})

`
