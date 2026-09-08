/**
 * check-mm 脚本纯函数层验证(scripts/check-mm/lib.mjs)
 *
 * 背景:缅甸运营商按具体 IP 封锁 Vercel 入口(76.76.21.21 / 216.198.79.1 均被封,
 * 76.76.21.22 可达)。脚本在本地(不开 VPN)检测当前 DNS 指向的 IP 是否可达,
 * 并可扫描候选段给出可用的备选 IP。网络探测通过注入的 probe 函数完成,测试不联网。
 */

import { describe, it, expect, vi } from 'vitest';
import {
  CANDIDATE_RANGES,
  DEFAULT_HOSTS,
  buildCandidateIps,
  parseCliArgs,
  runProbes,
  summarize,
  formatReport,
} from '../../scripts/check-mm/lib.mjs';

describe('buildCandidateIps', () => {
  it('每个 /24 段生成 256 个 IP,按顺序', () => {
    const ips = buildCandidateIps(['76.76.21']);
    expect(ips).toHaveLength(256);
    expect(ips[0]).toBe('76.76.21.0');
    expect(ips[255]).toBe('76.76.21.255');
  });

  it('默认候选段包含 Vercel 的两个入口段', () => {
    expect(CANDIDATE_RANGES).toEqual(['76.76.21', '216.198.79']);
    expect(buildCandidateIps(CANDIDATE_RANGES)).toHaveLength(512);
  });
});

describe('parseCliArgs', () => {
  it('默认不扫描,超时 8000ms,并发 8,主机为站点域名', () => {
    expect(parseCliArgs([])).toEqual({ scan: false, timeoutMs: 8000, concurrency: 8, hosts: DEFAULT_HOSTS });
  });

  it('解析 --scan、--timeout、--concurrency、--host', () => {
    expect(parseCliArgs(['--scan', '--timeout=3000', '--concurrency=4', '--host=example.com'])).toEqual({
      scan: true,
      timeoutMs: 3000,
      concurrency: 4,
      hosts: ['example.com'],
    });
  });
});

describe('runProbes', () => {
  it('按并发上限调用注入的 probe,结果顺序与输入一致', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const probe = vi.fn(async (ip: string) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return { ip, tcp: ip.endsWith('.22'), http: ip.endsWith('.22') ? 200 : null, ms: 5 };
    });
    const ips = ['76.76.21.21', '76.76.21.22', '76.76.21.23', '76.76.21.24', '76.76.21.25'];
    const results = await runProbes(ips, probe, 2);

    expect(results.map((r) => r.ip)).toEqual(ips);
    expect(maxInFlight).toBeLessThanOrEqual(2);
    expect(results[1]).toMatchObject({ tcp: true, http: 200 });
  });
});

describe('summarize + formatReport', () => {
  const reachable = (ip: string) => ({ ip, tcp: true, http: 200, ms: 800 });
  const blocked = (ip: string) => ({ ip, tcp: false, http: null, ms: 8000 });

  it('当前 IP 全部可达 → exitCode 0,建议「正常」', () => {
    const s = summarize({
      current: [{ host: 'betterbagsmm.com', results: [reachable('76.76.21.22')] }],
      scan: [],
    });
    expect(s.exitCode).toBe(0);
    expect(s.ok).toBe(true);
    expect(formatReport(s)).toContain('正常');
  });

  it('当前 IP 不可达且扫描到备选 → exitCode 1,建议改 A 记录为备选 IP', () => {
    const s = summarize({
      current: [{ host: 'betterbagsmm.com', results: [blocked('76.76.21.21')] }],
      scan: [blocked('76.76.21.21'), reachable('76.76.21.22'), reachable('216.198.79.2')],
    });
    expect(s.exitCode).toBe(1);
    expect(s.alternatives.map((r) => r.ip)).toEqual(['76.76.21.22', '216.198.79.2']);
    const report = formatReport(s);
    expect(report).toContain('76.76.21.22');
    expect(report).toContain('A');
  });

  it('当前 IP 不可达且无备选 → exitCode 1,提示未扫描或无可用入口', () => {
    const s = summarize({
      current: [{ host: 'betterbagsmm.com', results: [blocked('76.76.21.21')] }],
      scan: [],
    });
    expect(s.exitCode).toBe(1);
    expect(s.alternatives).toEqual([]);
    expect(formatReport(s)).toContain('--scan');
  });

  it('只有 TCP 通但 HTTP 非 2xx/3xx 的 IP 不算可达', () => {
    const s = summarize({
      current: [{ host: 'betterbagsmm.com', results: [{ ip: '76.76.21.22', tcp: true, http: null, ms: 8000 }] }],
      scan: [],
    });
    expect(s.ok).toBe(false);
  });
});
