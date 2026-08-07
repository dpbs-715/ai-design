/**
 * SSE 流式读取。
 *
 * 不能复用 `apiClient`:axios 在浏览器走 XHR,拿不到增量数据。这里用 fetch
 * 读 ReadableStream,`AbortController` 直接对应请求中断 —— 服务端监听
 * response 的 close 事件,断开即停止图执行。
 */

/** 一帧 SSE 事件。注释行(`: ping` 心跳)不会产出帧。 */
export interface SseFrame {
  event?: string
  data: string
}

/** 按空行分帧,解析出 event 与 data 字段。 */
function parseFrame(raw: string): SseFrame | undefined {
  const dataLines: string[] = []
  let event: string | undefined

  for (const line of raw.split('\n')) {
    // 注释行(心跳)没有字段名,直接跳过。
    if (line.startsWith(':')) continue
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const field = line.slice(0, separator)
    // 字段值前允许有一个空格。
    const value = line.slice(separator + 1).replace(/^ /, '')
    if (field === 'data') dataLines.push(value)
    else if (field === 'event') event = value
  }

  if (dataLines.length === 0) return undefined
  return { ...(event ? { event } : {}), data: dataLines.join('\n') }
}

export interface StreamSseOptions {
  path: string
  body: unknown
  signal?: AbortSignal
}

/**
 * POST 请求并逐帧产出 SSE 事件。
 *
 * 用 POST 而非 EventSource:请求体要带整个页面草稿,EventSource 只能发 GET。
 * 鉴权靠 cookie(`credentials: 'include'`),会话 cookie 的 path 是 `/api`。
 *
 * 非 2xx 响应按普通 JSON 错误处理 —— 服务端保证鉴权与参数校验都在写出
 * SSE 头之前完成,所以失败一定是正常的 HTTP 状态码,不会混在事件流里。
 */
export async function* streamSse({
  path,
  body,
  signal,
}: StreamSseOptions): AsyncGenerator<SseFrame> {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  })

  if (!response.ok || !response.body) {
    throw await toStreamError(response)
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += value

      // 帧以空行分隔。最后一段可能不完整,留在 buffer 里等下一个 chunk。
      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const frame = parseFrame(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        if (frame) yield frame
        boundary = buffer.indexOf('\n\n')
      }
    }
    // 流结束时若还有残帧(服务端没以空行收尾),补发出去。
    const trailing = parseFrame(buffer)
    if (trailing) yield trailing
  } finally {
    // 提前 break(消费方 return)时要主动断开,否则连接会挂着。
    await reader.cancel().catch(() => undefined)
  }
}

async function toStreamError(response: Response): Promise<Error> {
  const fallback = `请求失败(${response.status})`
  try {
    const payload = (await response.json()) as { message?: string | string[] }
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message
    return new Error(message ?? fallback)
  } catch {
    return new Error(fallback)
  }
}
