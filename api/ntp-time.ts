import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 统一稳定的 NTP 时间接口
 * ---------------------------------------------------------------
 * · 所有客户端都以「同一台 Vercel 服务器时钟」为唯一基准，天然保证一致。
 * · Vercel 运行环境的系统时钟由云基础设施持续通过 NTP 校准，稳定可靠，
 *   无需依赖 worldtimeapi.org 等经常抖动/宕机的第三方服务。
 * · 返回的 serverTime 一律是 UTC 毫秒时间戳（epoch ms），与任何时区无关，
 *   因此不会出现「Linux 浏览器 +8 小时」这类时区偏差问题。
 * · 可选地用 Cloudflare 官方时间头做一次交叉校验，偏差过大时以系统时钟为准。
 */
const CLOUDFLARE_TIME = 'https://time.cloudflare.com/';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const serverReceiveTime = Date.now(); // 权威基准：UTC epoch ms
  let serverTime = serverReceiveTime;
  let provider = 'vercel-system-ntp';

  // 交叉校验（可选，失败不影响主流程）
  try {
    const start = Date.now();
    const resp = await fetch(CLOUDFLARE_TIME, { method: 'HEAD', signal: AbortSignal.timeout(2500) });
    const dateHeader = resp.headers.get('date');
    if (dateHeader) {
      const cf = new Date(dateHeader).getTime();
      // 仅当与系统时钟偏差 < 30s 时采用（防止异常值）
      if (Number.isFinite(cf) && Math.abs(cf - Date.now()) < 30_000) {
        // Date 头只有秒级精度，用往返时间补偿一半网络延迟
        serverTime = cf + Math.round((Date.now() - start) / 2);
        provider = 'cloudflare+system';
      }
    }
  } catch { /* 忽略：直接使用服务器系统时钟 */ }

  return res.status(200).json({
    serverTime,          // UTC epoch ms（时区无关）
    serverReceiveTime,
    rtt: 0,
    provider,
    timezone: 'UTC',
    ok: true,
  });
}