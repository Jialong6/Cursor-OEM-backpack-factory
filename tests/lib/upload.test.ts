import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * lib/upload.ts 单元测试（同源中转 · 单文件 uploadOneFile）
 *
 * uploadOneFile 把单个文件「同源」POST 到 /api/upload（≤4MB 单请求;>4MB 切片 + complete）,
 * 支持进度回调与 AbortSignal 取消。用 FakeXHR 拦截 POST,驱动 onload/onprogress/onabort。
 */

type ProgressHandler = (e: { lengthComputable: boolean; loaded: number }) => void;

class FakeXHR {
  static instances: FakeXHR[] = [];
  upload: { onprogress: ProgressHandler | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  timeout = 0;
  status = 0;
  responseText = '';
  method = '';
  url = '';
  body: unknown = null;
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: unknown) {
    this.body = body;
    FakeXHR.instances.push(this);
  }
  abort() {
    this.onabort?.();
  }
  /** 测试辅助:模拟服务端 2xx + JSON 响应 */
  succeed(json: unknown) {
    this.status = 200;
    this.responseText = JSON.stringify(json);
    this.onload?.();
  }
}

import { uploadOneFile } from '@/lib/upload';

function makeFile(name: string, size: number, type = 'application/pdf'): File {
  // 真实字节,保证 file.slice 在分片测试中可用
  return new File([new Uint8Array(size)], name, { type });
}

describe('uploadOneFile (同源中转)', () => {
  beforeEach(() => {
    FakeXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXHR as unknown as typeof XMLHttpRequest);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('小文件单请求 POST 到 /api/upload,返回 {name,key,size,type}', async () => {
    const promise = uploadOneFile(makeFile('a.pdf', 100));
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));

    const xhr = FakeXHR.instances[0];
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toContain('/api/upload?filename=a.pdf');
    expect(xhr.url).toContain('contentType=application%2Fpdf');

    xhr.succeed({ key: 'inquiries/uuid-a.pdf' });

    const ref = await promise;
    expect(ref).toEqual({ name: 'a.pdf', key: 'inquiries/uuid-a.pdf', size: 100, type: 'application/pdf' });
  });

  it('进度回调返回本文件已传字节数', async () => {
    const onProgress = vi.fn();
    const promise = uploadOneFile(makeFile('a.pdf', 200), onProgress);
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));

    const xhr = FakeXHR.instances[0];
    xhr.upload.onprogress!({ lengthComputable: true, loaded: 120 });
    xhr.succeed({ key: 'inquiries/uuid-a.pdf' });
    await promise;

    expect(onProgress).toHaveBeenCalledWith(120);
  });

  it('大文件(>4MB)切分片逐片上传 + complete 拼接', async () => {
    const big = makeFile('big.jpg', 5 * 1024 * 1024, 'image/jpeg'); // 5MB -> 2 片
    const promise = uploadOneFile(big);

    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));
    const c1 = FakeXHR.instances[0];
    expect(c1.url).toContain('uploadId=');
    expect(c1.url).toContain('part=1&parts=2');
    c1.succeed({ ok: true, part: 1 });

    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(2));
    const c2 = FakeXHR.instances[1];
    expect(c2.url).toContain('part=2&parts=2');
    c2.succeed({ ok: true, part: 2 });

    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(3));
    const done = FakeXHR.instances[2];
    expect(done.url).toContain('complete=1');
    expect(done.url).toContain('parts=2');
    done.succeed({ key: 'inquiries/uuid-big.jpg' });

    const ref = await promise;
    expect(ref).toEqual({
      name: 'big.jpg',
      key: 'inquiries/uuid-big.jpg',
      size: 5 * 1024 * 1024,
      type: 'image/jpeg',
    });
  });

  it('POST 返回非 2xx 时拒绝(带服务端错误信息)', async () => {
    const promise = uploadOneFile(makeFile('a.pdf', 100));
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));
    const xhr = FakeXHR.instances[0];
    xhr.status = 400;
    xhr.responseText = JSON.stringify({ error: 'Unsupported file type.' });
    xhr.onload!();
    await expect(promise).rejects.toThrow(/Unsupported file type/);
  });

  it('网络错误时拒绝', async () => {
    const promise = uploadOneFile(makeFile('a.pdf', 100));
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));
    FakeXHR.instances[0].onerror!();
    await expect(promise).rejects.toThrow(/网络错误/);
  });

  it('abort 取消上传 → 请求被中止、Promise 拒绝', async () => {
    const controller = new AbortController();
    const promise = uploadOneFile(makeFile('a.pdf', 100), undefined, controller.signal);
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));

    let rejected = false;
    promise.catch(() => {
      rejected = true;
    });
    controller.abort(); // 触发 signal → xhr.abort() → onabort → reject
    await vi.waitFor(() => expect(rejected).toBe(true));
  });
});
