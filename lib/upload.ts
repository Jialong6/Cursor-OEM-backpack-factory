/**
 * 文件「同源中转」上传工具
 *
 * 浏览器把文件 POST 到本站自己的 /api/upload（同源,无跨域/无预检）,由服务器转存
 * Cloudflare R2。不再让浏览器跨域直连 R2 —— 跨域直传在 iOS Safari 上会被系统中断。
 *
 * 受 Vercel 单请求体 4.5MB 限制：≤4MB 文件单请求直传;>4MB 文件切成 ≤4MB 分片逐片上传,
 * 最后 complete 请求由服务端拼接。表单「即选即传」对每个文件并行调用 uploadOneFile。
 */

import type { UploadedFileRef } from '@/lib/validations';

/** 聚合进度结构（保留给 UploadProgressBar 组件） */
export interface UploadProgress {
  /** 已上传字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 0-100 的整数百分比 */
  percent: number;
}

/** 单分片/单请求大小：4MB,给 Vercel 4.5MB/请求 留足余量 */
const CHUNK_SIZE = 4 * 1024 * 1024;

/** 单文件进度回调：本文件已上传字节数（0..file.size） */
type FileProgress = (loadedInFile: number) => void;

/**
 * 上传单个文件（同源中转到 R2）。
 * @param onProgress 回调本文件已上传字节数
 * @param signal 可中途取消（移除文件时 abort）
 * @returns 文件引用 {name, key, size, type}
 */
export async function uploadOneFile(
  file: File,
  onProgress?: FileProgress,
  signal?: AbortSignal
): Promise<UploadedFileRef> {
  const contentType = file.type || 'application/octet-stream';
  const key =
    file.size <= CHUNK_SIZE
      ? await uploadSingle(file, contentType, onProgress, signal)
      : await uploadChunked(file, contentType, onProgress, signal);
  return { name: file.name, key, size: file.size, type: file.type };
}

/** 小文件：单次同源 POST 整个文件。 */
async function uploadSingle(
  file: File,
  contentType: string,
  onProgress?: FileProgress,
  signal?: AbortSignal
): Promise<string> {
  const url = `/api/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(contentType)}`;
  const res = await xhrPost(url, file, onProgress, signal);
  if (!res.key) throw new Error(res.error || '上传失败：服务端未返回 key');
  return res.key;
}

/** 大文件：切成 ≤4MB 分片逐片同源 POST,最后 complete 由服务端拼接。 */
async function uploadChunked(
  file: File,
  contentType: string,
  onProgress?: FileProgress,
  signal?: AbortSignal
): Promise<string> {
  const uploadId = crypto.randomUUID();
  const parts = Math.ceil(file.size / CHUNK_SIZE);
  let baseLoaded = 0; // 本文件已完成分片的累计字节

  for (let i = 0; i < parts; i++) {
    const start = i * CHUNK_SIZE;
    const blob = file.slice(start, Math.min(start + CHUNK_SIZE, file.size));
    const partNo = i + 1;
    const url = `/api/upload?uploadId=${uploadId}&part=${partNo}&parts=${parts}&size=${file.size}`;
    await xhrPost(url, blob, (loaded) => onProgress?.(baseLoaded + loaded), signal);
    baseLoaded += blob.size;
    onProgress?.(baseLoaded);
  }

  const completeUrl =
    `/api/upload?uploadId=${uploadId}&complete=1` +
    `&filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(contentType)}` +
    `&parts=${parts}&size=${file.size}`;
  const res = await xhrPost(completeUrl, null, undefined, signal);
  if (!res.key) throw new Error(res.error || '上传失败：拼接未返回 key');
  return res.key;
}

interface UploadResponse {
  key?: string;
  ok?: boolean;
  error?: string;
}

/** 用 XHR POST 上传 body 到同源 url;带 60s 超时与可选 AbortSignal（abort 时取消请求）。 */
function xhrPost(
  url: string,
  body: Blob | null,
  onLoaded?: FileProgress,
  signal?: AbortSignal
): Promise<UploadResponse> {
  return new Promise<UploadResponse>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = 60_000;

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort);
    const cleanup = () => signal?.removeEventListener('abort', onAbort);

    if (onLoaded) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable) onLoaded(event.loaded);
      };
    }
    xhr.onload = () => {
      cleanup();
      let data: UploadResponse = {};
      try {
        data = JSON.parse(xhr.responseText) as UploadResponse;
      } catch {
        // 非 JSON 响应：保持空对象,由状态码决定成败
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || `上传失败 (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('上传网络错误'));
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(new Error('上传超时'));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    xhr.send(body);
  });
}
