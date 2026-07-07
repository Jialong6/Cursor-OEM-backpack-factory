/**
 * 网络诊断(一次性):Node 原生 fetch 直连 Google Fonts 是否可用
 * (next/font 的下载器不走代理,用本脚本复现其网络路径)
 */
const targets = [
  'https://fonts.googleapis.com/css2?family=Inter',
  'https://fonts.gstatic.com/',
];
for (const url of targets) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    console.log(`direct fetch ${url} -> ${res.status}`);
  } catch (err) {
    console.log(`direct fetch ${url} -> FAILED: ${err.cause?.code ?? err.cause?.message ?? err.message}`);
  }
}
