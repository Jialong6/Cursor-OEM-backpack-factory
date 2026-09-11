# 缅语审校报告 —— 隐私政策与同意条(privacy / consent)

- 日期:2026-09-11
- 来源:`locales/en.json` 的 `privacy` 与 `consent` 命名空间
- 翻译:`scripts/translate/translate.mjs`(Gemini)
- 审校:一次性脚本,逐块喂「英文原文 + 缅语译文」给 Gemini 复核

缅语不接受单一来源直译,按既定流程再过一轮审校。本轮共发现 9 处问题,全部已应用到 `locales/my.json`。

## 问题清单

| 严重度 | 键 | 问题 |
| --- | --- | --- |
| high | `privacy.sections.7.paragraphs.0` | The text ends with a Chinese/Japanese full stop '。' instead of a standard Burmese full stop '။'. |
| medium | `privacy.sections.0.paragraphs.0` | The translation uses the colloquial subject marker 'က' (ကျွန်ုပ်တို့က), which violates the rule to avoid spoken markers in formal/written register. |
| medium | `privacy.sections.3.paragraphs.1` | Uses the colloquial subject marker 'က' in 'သင်က လက်ခံမှသာ', which violates the formal/written register rule. |
| medium | `consent.message` | Contains the colloquial spoken subject marker 'က' in 'သင်က'. Additionally, translating 'set' (for cookies) as 'အသုံးပြုမည်' (use) is slightly inaccurate. |
| low | `privacy.intro` | The translation for 'what you can do about it' ('သင်၏အခွင့်အရေးများကို မည်သို့အသုံးပြုနိုင်ကြောင်း') introduces the concept of 'rights' which is not explicitly in the source text. Additionally, 'စုဆောင်းသည်' is a more standard and formal term for data collection than 'ကောက်ယူသည်'. |
| low | `privacy.sections.1.paragraphs.0` | Incorrect spelling 'စျေး' (Sa + Ya yit) is used instead of the correct standard Unicode character 'ဈေး' (Zha). |
| low | `privacy.sections.1.paragraphs.1` | Incorrect spelling 'စျေး' (Sa + Ya yit) is used instead of the correct standard Unicode character 'ဈေး' (Zha). |
| low | `privacy.sections.6.paragraphs.0` | The word 'storage' is left untranslated in English. |
| low | `privacy.sections.8.paragraphs.0` | The word 'အပ်ဒိတ်လုပ်ပြီး' (updated) is a transliterated loanword which is slightly colloquial. |

## 值得记住的几类错误

- **标点串台**:一处段尾用了中日文句号 `。` 而不是缅文句号 `။`。这是本轮唯一的 high,肉眼扫一遍缅文很难发现,必须靠审校或 grep。
- **口语助词混入书面语**:多处出现口语主语标记 `က`(如 `ကျွန်ုပ်တို့က`、`သင်က`),法律文本应当用书面语。
- **非标准拼写**:`စျေး` 应为 `ဈေး`。
- **外来词残留**:`storage` 未译;`အပ်ဒိတ်လုပ်ပြီး` 是音译借词,偏口语。

## 机械核对(应用修正后)

- 中日文句号:0
- 缅文数字:0(要求全用阿拉伯数字)
- Zawgyi 特征字符:0
- ICU 占位符 `{date}` / `{email}` / `{state}`:均保留
- 品牌与服务商名(Better Bags Myanmar / Vercel / Cloudflare / Resend / Cal.com / Google Analytics / Microsoft Clarity):均保持拉丁字母
