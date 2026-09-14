import { formatKstDateTime } from '@/lib/date/kst'

const DISCORD_MESSAGE_LIMIT = 2000

type ReportNotification = {
  type: 'new_character' | 'new_event' | 'correction' | 'other'
  typeLabel: string
  title: string
  content: string
  referenceUrl: string | null
  contact: string | null
  createdAt: string
}

function trimMessage(value: string) {
  if (value.length <= DISCORD_MESSAGE_LIMIT) return value
  return `${value.slice(0, DISCORD_MESSAGE_LIMIT - 20)}\n…(내용 일부 생략)`
}

function getWebhookUrls(type: ReportNotification['type']) {
  const categoryVariable = {
    new_character: 'DISCORD_REPORT_WEBHOOK_NEW_CHARACTER',
    new_event: 'DISCORD_REPORT_WEBHOOK_NEW_EVENT',
    correction: 'DISCORD_REPORT_WEBHOOK_CORRECTION',
    other: 'DISCORD_REPORT_WEBHOOK_OTHER',
  }[type]
  return [...new Set([
    process.env.DISCORD_REPORT_WEBHOOK_URL?.trim(),
    process.env[categoryVariable]?.trim(),
  ].filter((url): url is string => Boolean(url)))]
}

async function sendToWebhook(webhookUrl: string, template: string) {
  try {
    const url = new URL(webhookUrl)
    if (!['discord.com', 'discordapp.com'].includes(url.hostname) || !url.pathname.startsWith('/api/webhooks/')) return

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: trimMessage(template),
          allowed_mentions: { parse: [] },
        }),
        signal: controller.signal,
      })
      if (!response.ok) console.error('Discord report notification failed:', response.status)
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    console.error('Discord report notification request failed:', error)
  }
}

export async function sendReportDiscordNotification(report: ReportNotification) {
  const template = [
    '[새 제보 접수]',
    '',
    '제보 유형:',
    report.typeLabel,
    '',
    '제목:',
    report.title,
    '',
    '내용:',
    report.content,
    '',
    '참고 링크:',
    report.referenceUrl ?? '없음',
    '',
    '연락처:',
    report.contact ?? '없음',
    '',
    '제보일시:',
    formatKstDateTime(report.createdAt),
  ].join('\n')

  await Promise.all(getWebhookUrls(report.type).map((webhookUrl) => sendToWebhook(webhookUrl, template)))
}
