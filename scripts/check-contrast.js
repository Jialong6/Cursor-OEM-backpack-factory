/**
 * 颜色对比度检查工具
 *
 * 根据 WCAG AA 标准检查项目中使用的颜色组合是否符合无障碍要求
 * - 普通文本：对比度至少 4.5:1
 * - 大文本（18pt及以上或14pt粗体及以上）：对比度至少 3:1
 */

/**
 * 将十六进制颜色转换为 RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 计算相对亮度
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * 计算对比度
 */
function getContrast(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 检查对比度是否符合 WCAG AA 标准
 */
function checkWCAG(contrast, isLargeText = false) {
  const threshold = isLargeText ? 3 : 4.5;
  return {
    pass: contrast >= threshold,
    level: contrast >= threshold ? 'AA' : 'Fail',
    contrast: contrast.toFixed(2)
  };
}

// Better Bags Myanmar 品牌色
const colors = {
  'Primary Cyan': '#81C3D7',
  'Primary Blue': '#416788',
  'Secondary Grey': '#5a6d7c',
  'Dark Blue': '#2f6690',
  'White': '#FFFFFF',
  'Black': '#000000',
  'Gray 50': '#F9FAFB',
  'Gray 100': '#F3F4F6',
  'Gray 200': '#E5E7EB',
  'Gray 300': '#D1D5DB',
  'Gray 400': '#9CA3AF',
  'Gray 500': '#6B7280',
  'Gray 600': '#4B5563',
  'Gray 700': '#374151',
  'Gray 800': '#1F2937',
  'Gray 900': '#111827'
};

console.log('\n=== Better Bags Myanmar 颜色对比度分析 ===\n');
console.log('WCAG AA 标准:');
console.log('- 普通文本: 对比度 ≥ 4.5:1');
console.log('- 大文本: 对比度 ≥ 3:1\n');

// 检查主要颜色组合
const combinations = [
  // 白色背景上的文本
  { bg: 'White', fg: 'Primary Cyan', usage: '白色背景上的Primary Cyan文本（仅用于装饰图标）', type: 'normal' },
  { bg: 'White', fg: 'Primary Blue', usage: '白色背景上的Primary Blue文本（DEFAULT primary）', type: 'normal' },
  { bg: 'White', fg: 'Secondary Grey', usage: '白色背景上的Secondary Grey文本', type: 'normal' },
  { bg: 'White', fg: 'Dark Blue', usage: '白色背景上的Dark Blue文本', type: 'normal' },
  { bg: 'White', fg: 'Gray 600', usage: '白色背景上的Gray-600文本（常用于描述）', type: 'normal' },
  { bg: 'White', fg: 'Gray 700', usage: '白色背景上的Gray-700文本', type: 'normal' },
  { bg: 'White', fg: 'Gray 900', usage: '白色背景上的Gray-900文本（标题）', type: 'normal' },

  // 灰色背景上的文本
  { bg: 'Gray 50', fg: 'Gray 700', usage: 'Gray-50背景上的Gray-700文本（FAQ答案）', type: 'normal' },
  { bg: 'Gray 50', fg: 'Gray 900', usage: 'Gray-50背景上的Gray-900文本', type: 'normal' },
  { bg: 'Gray 900', fg: 'Gray 300', usage: 'Gray-900背景上的Gray-300文本（Footer）', type: 'normal' },
  { bg: 'Gray 900', fg: 'White', usage: 'Gray-900背景上的白色文本（Footer标题）', type: 'normal' },

  // 品牌色背景上的文本
  { bg: 'Primary Cyan', fg: 'White', usage: 'Primary Cyan背景上的白色文本（仅用于装饰性徽章）', type: 'large' },
  { bg: 'Primary Blue', fg: 'White', usage: 'Primary Blue背景上的白色文本（按钮、标题）', type: 'large' },
  { bg: 'Dark Blue', fg: 'White', usage: 'Dark Blue背景上的白色文本', type: 'large' },
  { bg: 'Secondary Grey', fg: 'White', usage: 'Secondary Grey背景上的白色文本', type: 'large' },

  // 链接和高亮（已修复：DEFAULT primary 现在是 Blue）
  { bg: 'White', fg: 'Primary Blue', usage: '链接颜色（text-primary，现在指向 Primary Blue）', type: 'normal' },
];

console.log('颜色组合分析:\n');
console.log('序号 | 背景色 | 前景色 | 对比度 | 标准 | 结果 | 使用场景');
console.log('-----|--------|--------|--------|------|------|----------');

let totalFail = 0;
let totalPass = 0;

combinations.forEach((combo, index) => {
  const bgColor = colors[combo.bg];
  const fgColor = colors[combo.fg];
  const contrast = getContrast(bgColor, fgColor);
  const result = checkWCAG(contrast, combo.type === 'large');

  const status = result.pass ? '✓' : '✗';
  const statusEmoji = result.pass ? '✅' : '❌';

  if (result.pass) {
    totalPass++;
  } else {
    totalFail++;
  }

  console.log(
    `${String(index + 1).padStart(4)} | ${combo.bg.padEnd(14)} | ${combo.fg.padEnd(14)} | ${result.contrast.padStart(6)} | ${combo.type === 'large' ? '大文本' : '普通  '} | ${statusEmoji}${status.padEnd(3)} | ${combo.usage}`
  );
});

console.log('\n=== 总结 ===\n');
console.log(`✅ 通过: ${totalPass} 个颜色组合`);
console.log(`❌ 失败: ${totalFail} 个颜色组合`);

if (totalFail > 0) {
  console.log('\n⚠️  警告: 发现不符合 WCAG AA 标准的颜色组合！');
  console.log('建议调整这些颜色以提高对比度。\n');
  process.exit(1);
} else {
  console.log('\n✅ 所有颜色组合都符合 WCAG AA 标准！\n');
  process.exit(0);
}
