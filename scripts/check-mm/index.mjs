/**
 * 缅甸本地可达性检测 CLI
 *
 * 用法(在缅甸本地、不开 VPN 的机器上运行才有意义):
 *   npm run check-mm                       检测当前 DNS 指向的 IP 是否可达
 *   npm run check-mm -- --scan             另扫描 Vercel 入口段,列出可用备选 IP
 *   npm run check-mm -- --scan --timeout=3000 --concurrency=16
 *
 * 背景:缅甸运营商按具体 IP 封锁 Vercel 入口,名单会变。当前 IP 不可达时
 * 脚本给出可改的 A 记录值。强制直连(清空代理环境变量),结果代表本地网络。
 * 退出码:当前 IP 全部可达为 0,否则为 1,便于接 cron / CI。
 */

import { resolve4 } from 'node:dns/promises';

import {
  CANDIDATE_RANGES,
  buildCandidateIps,
  createProbe,
  formatReport,
  parseCliArgs,
  runProbes,
  summarize,
} from './lib.mjs';

for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']) {
  delete process.env[name];
}

async function resolveHost(host) {
  try {
    return await resolve4(host);
  } catch (error) {
    console.error(`DNS 解析失败 ${host}: ${error.code || error.message}`);
    return [];
  }
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const probe = createProbe({ host: args.hosts[0], timeoutMs: args.timeoutMs });

  const current = [];
  for (const host of args.hosts) {
    const ips = await resolveHost(host);
    console.log(`${host} -> ${ips.join(', ') || '(无)'}`);
    const results = await runProbes(ips, probe, args.concurrency);
    current.push({ host, ips, results });
  }

  let scan = [];
  if (args.scan) {
    const ips = buildCandidateIps(CANDIDATE_RANGES);
    console.log(`扫描 ${CANDIDATE_RANGES.join(', ')} 共 ${ips.length} 个 IP(并发 ${args.concurrency},单个最多 ${args.timeoutMs}ms)...`);
    scan = await runProbes(ips, probe, args.concurrency);
  }

  const summary = summarize({ current, scan });
  console.log(formatReport(summary));
  process.exitCode = summary.exitCode;
}

main().catch((error) => {
  console.error('check-mm 失败:', error.message);
  process.exitCode = 1;
});
