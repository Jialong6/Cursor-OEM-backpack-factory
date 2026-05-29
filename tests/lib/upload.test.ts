import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * lib/upload.ts 单元测试（R2 presigned 直传）
 *
 * uploadFilesToR2 流程：① fetch /api/upload 拿 presigned PUT URL + key
 * ② XHR PUT 直传 R2。这里 mock fetch（presign）+ FakeXHR（PUT），
 * 用 vi.waitFor 处理"先 await fetch 再创建 XHR"的异步时序。
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
  method = '';
  url = '';
  headers: Record<string, string> = {};
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send() {
    FakeXHR.instances.push(this);
  }
}

import { uploadFilesToR2 } from '@/lib/upload';

function makeFile(name: string, size: number, type = 'application/pdf'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

const PRESIGN_URL = 'https://acc.r2.cloudflarestorage.com/betterbags/put?sig=1';

describe('uploadFilesToR2', () => {
  beforeEach(() => {
    FakeXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXHR as unknown as typeof XMLHttpRequest);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ uploadUrl: PRESIGN_URL, key: 'inquiries/uuid-a.pdf' }),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests a presigned URL then PUTs the file, returning {name,key,size,type}', async () => {
    const promise = uploadFilesToR2([makeFile('a.pdf', 100)]);
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));

    const xhr = FakeXHR.instances[0];
    expect(xhr.method).toBe('PUT');
    expect(xhr.url).toContain('r2.cloudflarestorage.com');
    expect(xhr.headers['Content-Type']).toBe('application/pdf');

    xhr.status = 200;
    xhr.onload!();

    const refs = await promise;
    expect(refs).toEqual([
      { name: 'a.pdf', key: 'inquiries/uuid-a.pdf', size: 100, type: 'application/pdf' },
    ]);
  });

  it('reports aggregate progress reaching 100%', async () => {
    const onProgress = vi.fn();
    const promise = uploadFilesToR2([makeFile('a.pdf', 200)], onProgress);
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));

    const xhr = FakeXHR.instances[0];
    xhr.upload.onprogress!({ lengthComputable: true, loaded: 200 });
    xhr.status = 200;
    xhr.onload!();
    await promise;

    const last = onProgress.mock.calls.at(-1)?.[0];
    expect(last.total).toBe(200);
    expect(last.percent).toBe(100);
  });

  it('rejects when the PUT returns non-2xx', async () => {
    const promise = uploadFilesToR2([makeFile('a.pdf', 100)]);
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));
    const xhr = FakeXHR.instances[0];
    xhr.status = 403;
    xhr.onload!();
    await expect(promise).rejects.toThrow();
  });

  it('throws when the presign request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: 'Unsupported file type.' }) }))
    );
    await expect(uploadFilesToR2([makeFile('a.bin', 100)])).rejects.toThrow();
  });

  it('returns an empty array and does nothing for no files', async () => {
    const refs = await uploadFilesToR2([]);
    expect(refs).toEqual([]);
    expect(FakeXHR.instances.length).toBe(0);
  });
});
