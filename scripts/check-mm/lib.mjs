/**
 * check-mm 纯函数层:本地网络对 Vercel 入口 IP 的可达性检测
 *
 * 背景(2026-09):缅甸运营商按具体 IP 封锁 Vercel 入口 —— 官方推荐的
 * 76.76.21.21 与 216.198.79.1 均被封,但同段的 76.76.21.22 等仍可达。
 * 站点域名的 A 记录指向哪个 IP 决定了缅甸本地能否打开网站。
 *
 * 设计约定:
 * - 网络探测通过注入的 probe 函数完成(createProbe 是默认实现),测试不联网
 * - 只依赖 node 内置模块;结果判定与报告文案是纯函数
 */

import { connect } from 'node:net';
import { request as httpsRequest } from 'node:https';

export const DEFAULT_HOSTS = ['betterbagsmm.com', 'www.betterbagsmm.com'];

/** Vercel 自定义域入口所在的两个 /24 段 */
export const CANDIDATE_RANGES = ['76.76.21', '216.198.79'];

export const DEFAULT_TIMEOUT_MS = 8000;
export const DEFAULT_CONCURRENCY = 8;

/** 把 /24 段前缀展开为 256 个 IP */
export function buildCandidateIps(ranges) {
  return ranges.flatMap((prefix) =>
    Array.from({ length: 256 }, (_, i) => `${prefix}.${i}`)
  );
}

/**
 * 解析 CLI 参数
 * --scan            扫描候选段,列出可用备选 IP
 * --timeout=<ms>    单个探测超时(默认 8000)
 * --concurrency=<n> 并发数(默认 8)
 * --host=<domain>   只检测指定域名(默认站点主域与 www)
 */
export function parseCliArgs(argv) {
  const parsed = {
    scan: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    concurrency: DEFAULT_CONCURRENCY,
    hosts: DEFAULT_HOSTS,
  };
  for (const arg of argv) {
    if (arg === '--scan') parsed.scan = true;
    else if (arg.startsWith('--timeout=')) parsed.timeoutMs = Number(arg.slice('--timeout='.length));
    else if (arg.startsWith('--concurrency=')) parsed.concurrency = Number(arg.slice('--concurrency='.length));
    else if (arg.startsWith('--host=')) parsed.hosts = [arg.slice('--host='.length)];
    else throw new Error(`unknown arg: ${arg}`);
  }
  return parsed;
}

/** TCP 443 握手探测 */
export function tcpProbe(ip, timeoutMs, port = 443) {
  const started = Date.now();
  return new Promise((resolve) => {
    const socket = connect({ host: ip, port });
    const finish = (ok) => {
      socket.destroy();
      resolve({ ok, ms: Date.now() - started });
    };
    socket.setTimeout(timeoutMs, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

/** 经指定 IP 以站点 SNI/Host 发一次 HTTPS GET,返回状态码(失败为 null) */
export function httpsProbe(ip, host, timeoutMs, path = '/en') {
  const started = Date.now();
  return new Promise((resolve) => {
    const req = httpsRequest(
      { host: ip, servername: host, port: 443, path, method: 'GET', headers: { Host: host }, timeout: timeoutMs },
      (res) => {
        res.resume();
        resolve({ status: res.statusCode ?? null, ms: Date.now() - started });
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => resolve({ status: null, ms: Date.now() - started }));
    req.end();
  });
}

/** 默认探测实现:先 TCP,再带 SNI 的 HTTPS */
export function createProbe({ host, timeoutMs }) {
  return async (ip) => {
    const tcp = await tcpProbe(ip, Math.min(timeoutMs, 5000));
    if (!tcp.ok) return { ip, tcp: false, http: null, ms: tcp.ms };
    const http = await httpsProbe(ip, host, timeoutMs);
    return { ip, tcp: true, http: http.status, ms: tcp.ms + http.ms };
  };
}

/** 以固定并发跑探测,结果顺序与输入一致 */
export async function runProbes(ips, probe, concurrency) {
  const results = new Array(ips.length);
  let next = 0;
  const worker = async () => {
    while (next < ips.length) {
      const index = next;
      next += 1;
      results[index] = await probe(ips[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return results;
}

/** 可达 = TCP 通且 HTTPS 返回 2xx/3xx(能真正服务本站) */
export function isReachable(result) {
  return result.tcp === true && typeof result.http === 'number' && result.http >= 200 && result.http < 400;
}

export function summarize({ current, scan }) {
  const ok = current.every((entry) => entry.results.length > 0 && entry.results.every(isReachable));
  const alternatives = scan.filter(isReachable);
  return { ok, current, alternatives, scanned: scan.length, exitCode: ok ? 0 : 1 };
}

export function formatReport(summary) {
  const lines = [];
  for (const entry of summary.current) {
    lines.push(`${entry.host}:`);
    if (entry.results.length === 0) lines.push('  (DNS 未解析出 IPv4)');
    for (const r of entry.results) {
      const state = isReachable(r) ? `可达 HTTP ${r.http}` : r.tcp ? `TCP 通但 HTTP 失败` : 'TCP 超时/拒绝';
      lines.push(`  ${r.ip.padEnd(16)} ${state} (${r.ms}ms)`);
    }
  }
  if (summary.scanned > 0) {
    lines.push(`扫描 ${summary.scanned} 个候选 IP,可达 ${summary.alternatives.length} 个:`);
    for (const r of summary.alternatives) lines.push(`  ${r.ip.padEnd(16)} HTTP ${r.http} (${r.ms}ms)`);
  }
  if (summary.ok) {
    lines.push('结论:当前 DNS 指向的 IP 在本地网络全部可达,状态正常。');
  } else if (summary.alternatives.length > 0) {
    const [best, ...rest] = summary.alternatives;
    const backup = rest.length ? `(备选:${rest.map((r) => r.ip).join(', ')})` : '';
    lines.push(`结论:当前 IP 不可达。建议把 Cloudflare 的 A 记录(主域与 www)改为 ${best.ip} ${backup}`.trim());
  } else {
    lines.push('结论:当前 IP 不可达,且没有可用备选。若未扫描请加 --scan 重跑;扫描后仍无结果,只能等待封锁变化或临时使用 VPN。');
  }
  return lines.join('\n');
}
