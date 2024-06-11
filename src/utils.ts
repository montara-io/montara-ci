export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDuration(
  durationSeconds: number,
  {
    minimumValue = 1,
    isAccurate = false
  }: { minimumValue?: number; isAccurate?: boolean } = {}
): string {
  if (durationSeconds < minimumValue) {
    return '-'
    // return `${Math.round(durationSeconds * 60)} Mins.`;
  } else if (durationSeconds < 60) {
    return `${formatNumber(Math.round(durationSeconds))} Sec${Math.round(durationSeconds) === 1 ? '' : 's'}.`
  } else if (durationSeconds < 3600) {
    const minutes = Math.floor(durationSeconds / 60)
    const seconds = Math.round(durationSeconds % 60)
    const minText = `${formatNumber(minutes)} Min${minutes === 1 ? '' : 's'}.`
    const secText =
      isAccurate && seconds > 0
        ? ` ${formatNumber(seconds)} Sec${seconds === 1 ? '' : 's'}.`
        : ''
    return `${minText}${secText}`
  } else {
    const hours = Math.floor(durationSeconds / 3600)
    const minutes = Math.round((durationSeconds % 3600) / 60)
    const hourText = `${hours} Hr${hours === 1 ? '' : 's'}.`
    const minText =
      isAccurate && minutes > 0
        ? ` ${minutes} Min${minutes === 1 ? '' : 's'}.`
        : ''
    return `${hourText}${minText}`
  }
}

export function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
