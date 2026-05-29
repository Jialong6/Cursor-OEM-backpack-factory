/**
 * 文件直传 Vercel Blob 工具
 *
 * Vercel 函数有 4.5MB 请求体硬上限，无法承载大文件上传，故文件改为浏览器经
 * @vercel/blob/client 直传到 Blob，拿到公开 URL 后再随表单 JSON 提交给 /api/contact。
 * 直传天然带进度事件，按所有文件总字节聚合，沿用 UploadProgress 形状供进度条复用。
 */

import { upload } from '@vercel/blob/client';
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
 * 顺序直传多个文件到 Vercel Blob，并回调聚合上传进度。
 *
 * @param files 待上传文件
 * @param onProgress 上传过程中持续回调；percent 达到 100 表示全部文件已传完
 * @returns 每个文件的引用（name + 公开 url + size + type），用于提交与邮件附件
 */
export async function uploadFilesToBlob(
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFileRef[]> {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  let completedBytes = 0;
  const refs: UploadedFileRef[] = [];

  for (const file of files) {
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      onUploadProgress: ({ percentage }) => {
        const loaded = completedBytes + (percentage / 100) * file.size;
        onProgress?.({
          loaded,
          total,
          percent: total > 0 ? Math.round((loaded / total) * 100) : 0,
        });
      },
    });

    completedBytes += file.size;
    refs.push({ name: file.name, url: blob.url, size: file.size, type: file.type });
  }

  return refs;
}
