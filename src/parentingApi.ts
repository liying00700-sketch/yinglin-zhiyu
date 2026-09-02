import type { ParentingAnswer, ParentingSource } from './types'

type AskPayload = {
  question: string
  profile: {
    ageMonths: string
    duration: string
    frequency: string
    tried: string
    triedFor: string
    outcome: string
  }
}

function readAnswer(value: unknown): ParentingAnswer {
  if (!value || typeof value !== 'object') throw new Error('回答格式不完整，请重试')
  const answer = value as Record<string, unknown>
  const required = ['judgment', 'title', 'empathy', 'action', 'script', 'observe', 'escalation'] as const
  if (required.some((key) => typeof answer[key] !== 'string' || !String(answer[key]).trim())) {
    throw new Error('回答格式不完整，请重试')
  }
  if (!Array.isArray(answer.signals) || answer.signals.some((item) => typeof item !== 'string')) {
    throw new Error('回答格式不完整，请重试')
  }
  return {
    judgment: String(answer.judgment),
    title: String(answer.title),
    empathy: String(answer.empathy),
    signals: answer.signals.map(String).slice(0, 3),
    action: String(answer.action),
    script: String(answer.script),
    observe: String(answer.observe),
    escalation: String(answer.escalation),
    sourceNote: typeof answer.sourceNote === 'string' ? answer.sourceNote : undefined,
  }
}

export async function askParentingAI(payload: AskPayload): Promise<{ answer: ParentingAnswer; sources: ParentingSource[] }> {
  let response: Response
  try {
    response = await fetch('/api/parenting/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'answer', ...payload }),
    })
  } catch {
    throw new Error('问答服务暂时无法连接，请稍后重试')
  }

  const data = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '暂时无法生成回答')
  const match = String(data.content || '').match(/\{[\s\S]*\}/)
  if (!match) throw new Error('回答格式不完整，请重试')

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new Error('回答格式不完整，请重试')
  }

  const sources = Array.isArray(data.sources)
    ? data.sources.filter((item): item is ParentingSource => Boolean(item && typeof item === 'object' && typeof (item as ParentingSource).title === 'string' && typeof (item as ParentingSource).kind === 'string'))
    : []
  return { answer: readAnswer(parsed), sources }
}
