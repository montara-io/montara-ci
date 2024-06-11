import { Analytics } from '@segment/analytics-node'
import { generateUuid } from './utils'

type AnalyticsEvent =
  | 'montara_ciJobStarted'
  | 'montara_ciJobSuccess'
  | 'montara_ciJobFailed'
  | 'montara_ciJobRuntimeError'

const analytics = new Analytics({
  writeKey: 'R2YDLufDCtD99o9cAYwwxXeOKgu1wEkh'
})

const anonymousId = generateUuid()

export function trackEvent({
  eventName,
  eventProperties = {}
}: {
  eventName: AnalyticsEvent
  eventProperties?: Record<string, string | number | boolean>
}) {
  analytics?.track({
    event: eventName,
    anonymousId,
    properties: eventProperties
  })
}
