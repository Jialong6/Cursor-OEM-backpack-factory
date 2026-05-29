import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadFormData } from '@/lib/upload';

/**
 * lib/upload.ts 单元测试
 *
 * 用 fake XMLHttpRequest 驱动 upload.onprogress / onload / onerror，
 * 验证进度回调、响应解析与错误处理。
 */

type ProgressHandler = (e: { lengthComputable: boolean; loaded: number; total: number }) => void;

class FakeXHR {
  static instances: FakeXHR[] = [];
  upload: { onprogress: ProgressHandler | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  timeout = 0;
  status = 0;
  responseText = '';
  method = '';
  url = '';
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send() {
    FakeXHR.instances.push(this);
  }
}

describe('uploadFormData', () => {
  beforeEach(() => {
    FakeXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXHR as unknown as typeof XMLHttpRequest);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports progress and resolves with parsed body on success', async () => {
    const onProgress = vi.fn();
    const promise = uploadFormData('/api/contact', new FormData(), onProgress);
    const xhr = FakeXHR.instances[0];

    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('/api/contact');

    xhr.upload.onprogress!({ lengthComputable: true, loaded: 25, total: 100 });
    xhr.upload.onprogress!({ lengthComputable: true, loaded: 100, total: 100 });

    xhr.status = 200;
    xhr.responseText = JSON.stringify({ success: true });
    xhr.onload!();

    const result = await promise;
    expect(onProgress).toHaveBeenNthCalledWith(1, { loaded: 25, total: 100, percent: 25 });
    expect(onProgress).toHaveBeenLastCalledWith({ loaded: 100, total: 100, percent: 100 });
    expect(result).toEqual({ ok: true, status: 200, body: { success: true } });
  });

  it('ignores progress events that are not lengthComputable', async () => {
    const onProgress = vi.fn();
    const promise = uploadFormData('/x', new FormData(), onProgress);
    const xhr = FakeXHR.instances[0];

    xhr.upload.onprogress!({ lengthComputable: false, loaded: 0, total: 0 });
    expect(onProgress).not.toHaveBeenCalled();

    xhr.status = 200;
    xhr.responseText = '{}';
    xhr.onload!();
    await promise;
  });

  it('resolves ok:false on 4xx/5xx', async () => {
    const promise = uploadFormData('/x', new FormData());
    const xhr = FakeXHR.instances[0];

    xhr.status = 400;
    xhr.responseText = JSON.stringify({ success: false });
    xhr.onload!();

    const result = await promise;
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ success: false });
  });

  it('treats a non-JSON response body as null', async () => {
    const promise = uploadFormData('/x', new FormData());
    const xhr = FakeXHR.instances[0];

    xhr.status = 200;
    xhr.responseText = '<html>oops</html>';
    xhr.onload!();

    const result = await promise;
    expect(result.body).toBeNull();
  });

  it('rejects on network error', async () => {
    const promise = uploadFormData('/x', new FormData());
    const xhr = FakeXHR.instances[0];

    xhr.onerror!();
    await expect(promise).rejects.toThrow('Network error');
  });

  it('sets a timeout and rejects when it fires', async () => {
    const promise = uploadFormData('/x', new FormData());
    const xhr = FakeXHR.instances[0];

    expect(xhr.timeout).toBe(60000);
    xhr.ontimeout!();
    await expect(promise).rejects.toThrow('timed out');
  });
});
