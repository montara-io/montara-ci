import { buildRunResultTemplate } from './pipeline-run'

describe('pipeline run', () => {
  it('should propery format the github comment', () => {
    expect(
      buildRunResultTemplate({
        status: 'failed',
        errors: {
          generalErrors: [{ type: 'test error', message: 'test error' }]
        },
        isStaging: false,
        numFailed: 1,
        numModels: 3,
        numPassed: 1,
        numSkipped: 1,
        pipelineId: '123',
        runDuration: '1 Min',
        runId: '123'
      })
    ).not.toContain(`{{`)
  })
})
