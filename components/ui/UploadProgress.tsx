'use client';

import type { UploadProgress } from '@/lib/upload';

interface UploadProgressBarProps {
  progress: UploadProgress;
  /** 无障碍标签（复用表单文件区的翻译，避免新增 i18n key） */
  label: string;
}

/** 字节数转人类可读（KB / MB），用于进度文案 */
function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 文件上传进度条
 *
 * 提交大文件时显示真实上传进度（百分比 + 已传/总大小）。
 * percent 达到 100 表示文件已发送完毕、服务器处理中。
 * 文案只用纯数字，不依赖额外翻译 key。
 */
export default function UploadProgressBar({ progress, label }: UploadProgressBarProps) {
  const { percent, loaded, total } = progress;
  const hasSize = total > 0;

  return (
    // 不放 aria-live：进度由下方 progressbar 的 aria-valuenow 暴露，
    // 避免每个 onprogress tick 都被屏幕阅读器逐条播报
    <div className="mt-3">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
        <span>{percent}%</span>
        {hasSize && (
          <span>
            {formatBytes(loaded)} / {formatBytes(total)}
          </span>
        )}
      </div>
      <div
        className="h-2 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`${label}: ${percent}%`}
      >
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-150 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
