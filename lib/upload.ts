/**
 * 文件「同源中转」上传工具
 *
 * 浏览器把文件 POST 到本站自己的 /api/upload（同源，无跨域、无预检），由服务器转存
 * Cloudflare R2。不再让浏览器跨域直连 R2 —— 跨域直传在 iOS Safari 上会被系统中断
 * （NSURLError -1005「网络连接已中断 / access control checks」）。
 *
 * 受 Vercel 单请求体 4.5MB 限制：≤4MB 文件单请求直传；>4MB 文件切成 ≤4MB 分片逐片上传，
 * 最后 complete 请求由服务端拼接。拿到 key 后随表单 JSON 提交给 /api/contact。
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

/** 单分片/单请求大小：4MB，给 Vercel 4.5MB/请求 留足余量 */
const CHUNK_SIZE = 4 * 1024 * 1024;

/**
 * 顺序上传多个文件（同源中转到 R2），回调聚合进度。
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
    const report = (loadedInFile: number) => {
      const aggregated = completedBytes + loadedInFile;
      onProgress?.({
        loaded: aggregated,
        total,
        percent: total > 0 ? Math.round((aggregated / total) * 100) : 0,
      });
    };

    const key =
      file.size <= CHUNK_SIZE
        ? await uploadSingle(file, contentType, report)
        : await uploadChunked(file, contentType, report);

    completedBytes += file.size;
    refs.push({ name: file.name, key, size: file.size, type: file.type });
  }

  return refs;
}

/** 小文件：单次同源 POST 整个文件，进度用 upload.onprogress。 */
async function uploadSingle(
  file: File,
  contentType: string,
  report: (loaded: number) => void
): Promise<string> {
  const url = `/api/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(contentType)}`;
  const res = await xhrPost(url, file, report);
  if (!res.key) throw new Error(res.error || '上传失败：服务端未返回 key');
  return res.key;
}

/** 大文件：切成 ≤4MB 分片逐片同源 POST，最后 complete 由服务端拼接。 */
async function uploadChunked(
  file: File,
  contentType: string,
  report: (loaded: number) => void
): Promise<string> {
  const uploadId = crypto.randomUUID();
  const parts = Math.ceil(file.size / CHUNK_SIZE);
  let baseLoaded = 0; // 本文件已完成分片的累计字节

  for (let i = 0; i < parts; i++) {
    const start = i * CHUNK_SIZE;
    const blob = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
    const partNo = i + 1;
    const url = `/api/upload?uploadId=${uploadId}&part=${partNo}&parts=${parts}&size=${file.size}`;
    await xhrPost(url, blob, (loaded) => report(baseLoaded + loaded));
    baseLoaded += blob.size;
    report(baseLoaded);
  }

  const completeUrl =
    `/api/upload?uploadId=${uploadId}&complete=1` +
    `&filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(contentType)}` +
    `&parts=${parts}&size=${file.size}`;
  const res = await xhrPost(completeUrl, null);
  if (!res.key) throw new Error(res.error || '上传失败：拼接未返回 key');
  return res.key;
}

interface UploadResponse {
  key?: string;
  ok?: boolean;
  error?: string;
}

/** 用 XHR POST 上传 body 到同源 url，回调已上传字节数；带 60s 超时，绝不无限卡住。 */
function xhrPost(
  url: string,
  body: Blob | null,
  onLoaded?: (loaded: number) => void
): Promise<UploadResponse> {
  return new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = 60_000;
    if (onLoaded) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable) onLoaded(event.loaded);
      };
    }
    xhr.onload = () => {
      let data: UploadResponse = {};
      try {
        data = JSON.parse(xhr.responseText) as UploadResponse;
      } catch {
        // 非 JSON 响应：保持空对象，由状态码决定成败
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || `上传失败 (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('上传网络错误'));
    xhr.ontimeout = () => reject(new Error('上传超时'));
    xhr.onabort = () => reject(new Error('上传被取消'));
    xhr.send(body);
  });
}
