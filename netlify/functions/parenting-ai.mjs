const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
}

function response(statusCode, body) {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(body) }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return response(405, { error: '只支持 POST 请求' })
  if (!process.env.PARENTING_API_URL) return response(503, { error: '育儿问答服务尚未配置，请联系管理员' })
  if ((event.body || '').length > 64_000) return response(413, { error: '提交内容过长，请精简后重试' })

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return response(400, { error: '请求格式不正确' })
  }
  if (payload.mode !== 'answer' || typeof payload.question !== 'string' || payload.question.trim().length < 4) {
    return response(400, { error: '请先完整描述想咨询的情况' })
  }

  const headers = { 'Content-Type': 'application/json' }
  if (process.env.PARENTING_API_TOKEN) headers.Authorization = `Bearer ${process.env.PARENTING_API_TOKEN}`

  try {
    const upstream = await fetch(process.env.PARENTING_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    })
    const data = await upstream.json().catch(() => ({}))
    if (!upstream.ok) return response(upstream.status >= 500 ? 502 : upstream.status, { error: data.error || '育儿问答服务暂时不可用' })
    return response(200, data)
  } catch {
    return response(502, { error: '育儿问答服务暂时无法连接，请稍后重试' })
  }
}
