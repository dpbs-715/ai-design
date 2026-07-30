const relativeTimeFormatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })

export function compareWorkspaceTimeDescending(left?: string, right?: string) {
  return (Date.parse(right ?? '') || 0) - (Date.parse(left ?? '') || 0)
}

export function formatWorkspaceTime(value: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return '时间未知'

  const difference = timestamp - Date.now()
  const minutes = Math.round(difference / 60_000)
  if (Math.abs(difference) < 60_000) return '刚刚'
  if (Math.abs(minutes) < 60) return relativeTimeFormatter.format(minutes, 'minute')

  const hours = Math.round(difference / 3_600_000)
  if (Math.abs(hours) < 24) return relativeTimeFormatter.format(hours, 'hour')

  const days = Math.round(difference / 86_400_000)
  if (Math.abs(days) < 7) return relativeTimeFormatter.format(days, 'day')

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}
