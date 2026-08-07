import type { Response } from 'express'

/**
 * SSE 空闲心跳间隔。反向代理普遍在 60s 掐掉空闲连接,而 agent 的工具循环
 * 中途可能几十秒没有任何节点事件,所以定期发注释行保活。
 */
const HEARTBEAT_INTERVAL_MS = 15_000

/** 保留 SSE 线路格式(而非 NDJSON),将来若换回 EventSource 不必改服务端。 */
function writeEvent(response: Response, event: { type: string }): void {
  response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
}

/**
 * 把异步事件流写成 SSE 响应。
 *
 * 调用方必须在进入这里之前完成鉴权与参数校验 —— 一旦写出 200 头,
 * 就再没有办法把失败表达成 HTTP 状态码了。
 */
export async function writeSseStream<TEvent extends { type: string }>(
  response: Response,
  events: AsyncIterable<TEvent>,
): Promise<void> {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // 关掉 nginx 的响应缓冲,否则事件会被攒着一起发。
    'X-Accel-Buffering': 'no',
  })
  response.flushHeaders()

  const heartbeat = setInterval(() => response.write(': ping\n\n'), HEARTBEAT_INTERVAL_MS)

  try {
    for await (const event of events) {
      writeEvent(response, event)
    }
  } finally {
    clearInterval(heartbeat)
    response.end()
  }
}
