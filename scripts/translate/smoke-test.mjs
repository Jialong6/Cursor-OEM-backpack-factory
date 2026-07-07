/**
 * Gemini 连通性冒烟测试:验证 API Key 与模型可用,试译一句缅文
 * 用法:node scripts/translate/smoke-test.mjs
 */

import { callGemini, GEMINI_MODEL, GEMINI_API_KEY } from './lib/gemini.mjs';

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY missing in .env.local');
    process.exit(1);
  }
  console.log(`model: ${GEMINI_MODEL}`);
  const text = await callGemini({
    system: 'You are a professional English-to-Burmese translator. Reply with ONLY the Burmese translation, no commentary.',
    user: 'Get A Quote',
    temperature: 0.2,
  });
  console.log(`burmese: ${text.trim()}`);
  console.log('smoke test OK');
}

main().catch((err) => {
  console.error(`smoke test FAILED: ${err.message}`);
  process.exit(1);
});
