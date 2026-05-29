/**
 * 带上传进度的表单提交工具
 *
 * fetch API 无法监听上传进度，故用 XMLHttpRequest 包一层 Promise，
 * 通过回调上报 upload.onprogress —— 用于大文件提交时显示进度条。
 */

export interface UploadProgress {
  /** 已上传字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 0-100 的整数百分比 */
  percent: number;
}

export interface UploadResult {
  /** HTTP 状态码是否 2xx */
  ok: boolean;
  status: number;
  /** 解析后的 JSON 响应体；非 JSON 时为 null */
  body: unknown;
}

/**
 * 以 multipart/form-data POST 提交 FormData，并回调上传进度。
 *
 * @param onProgress 上传过程中持续回调；percent 达到 100 表示请求体已发送完毕、
 *                   服务器正在处理（此后等待 onload 拿到响应）。
 */
export function uploadFormData(
  url: string,
  formData: FormData,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    // 防止请求体发完后服务端 hang 住导致 Promise 永不 settle、表单永久卡在提交中
    xhr.timeout = 60_000;
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    if (onProgress) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (!event.lengthComputable) return;
        const percent =
          event.total > 0 ? Math.round((event.loaded / event.total) * 100) : 0;
        onProgress({ loaded: event.loaded, total: event.total, percent });
      };
    }

    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.send(formData);
  });
}
