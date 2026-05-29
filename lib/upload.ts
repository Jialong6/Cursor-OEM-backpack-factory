/**
 * 文件经 Cloudflare R2 presigned PUT 直传工具
 *
 * Vercel 函数有 4.5MB 请求体上限，且 Vercel Blob 客户端直传有 CORS 死路；
 * 故文件改为：先向 /api/upload 取 R2 presigned PUT URL，再用 XHR 直传 R2（带进度），
 * 拿到 key 后随表单 JSON 提交给 /api/contact。R2 bucket CORS 允许 PUT，无跨域问题。
 */

import type { UploadedFileRef } from '@/lib/validations';

export interface UploadProgress {
  /** 已上传字节数（跨所有文件聚合） */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 0-100 的整数百分比 */
  percent: number;
}

/**
 * 顺序直传多个文件到 R2，回调聚合进度。
 * @returns 每个文件的引用 {name, key, size, type}
 */
export async function uploadFilesToR2(
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFileRef[]> {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  let completedBytes = 0;
  const refs: UploadedFileRef[] = [];

  for (const file of files) {
    const contentType = file.type || 'application/octet-stream';

    // 1) 取 presigned PUT URL + key
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType, size: file.size }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(`获取上传链接失败: ${data?.error || res.status}`);
    }
    const { uploadUrl, key } = (await res.json()) as { uploadUrl: string; key: string };

    // 2) XHR PUT 直传 R2（进度 + 60s 超时兜底）
    await putToR2(uploadUrl, file, contentType, (loaded) => {
      const aggregated = completedBytes + loaded;
      onProgress?.({
        loaded: aggregated,
        total,
        percent: total > 0 ? Math.round((aggregated / total) * 100) : 0,
      });
    });

    completedBytes += file.size;
    refs.push({ name: file.name, key, size: file.size, type: file.type });
  }

  return refs;
}

/** 用 XHR PUT 把文件传到 presigned URL，回调已上传字节数；带 60s 超时，绝不无限卡住。 */
function putToR2(
  url: string,
  file: File,
  contentType: string,
  onLoaded: (loaded: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    // 必须与 /api/upload 签名时的 Content-Type 一致，否则 R2 返回 403
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.timeout = 60_000;
    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable) onLoaded(event.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`上传失败 (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('上传网络错误'));
    xhr.ontimeout = () => reject(new Error('上传超时'));
    xhr.onabort = () => reject(new Error('上传被取消'));
    xhr.send(file);
  });
}
