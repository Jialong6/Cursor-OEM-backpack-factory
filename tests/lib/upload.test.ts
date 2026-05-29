import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * lib/upload.ts 单元测试
 *
 * 文件改为浏览器直传 Vercel Blob，这里 mock @vercel/blob/client 的 upload，
 * 覆盖：返回引用、传参（public + handleUploadUrl）、聚合进度、空文件。
 */

const { uploadMock } = vi.hoisted(() => ({ uploadMock: vi.fn() }));
vi.mock('@vercel/blob/client', () => ({
  upload: uploadMock,
}));

import { uploadFilesToBlob } from '@/lib/upload';

function makeFile(name: string, size: number, type = 'application/pdf'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('uploadFilesToBlob', () => {
  beforeEach(() => {
    uploadMock.mockReset();
  });

  it('uploads each file and returns refs with blob urls', async () => {
    uploadMock.mockImplementation(async (name: string) => ({
      url: `https://store.public.blob.vercel-storage.com/${name}-rand`,
    }));

    const files = [makeFile('a.pdf', 100), makeFile('b.png', 200, 'image/png')];
    const refs = await uploadFilesToBlob(files);

    expect(uploadMock).toHaveBeenCalledTimes(2);
    expect(refs).toEqual([
      {
        name: 'a.pdf',
        url: 'https://store.public.blob.vercel-storage.com/a.pdf-rand',
        size: 100,
        type: 'application/pdf',
      },
      {
        name: 'b.png',
        url: 'https://store.public.blob.vercel-storage.com/b.png-rand',
        size: 200,
        type: 'image/png',
      },
    ]);
  });

  it('uploads with public access via the /api/upload handler route', async () => {
    uploadMock.mockResolvedValue({ url: 'https://store.public.blob.vercel-storage.com/x' });
    await uploadFilesToBlob([makeFile('a.pdf', 100)]);
    const opts = uploadMock.mock.calls[0][2];
    expect(opts.access).toBe('public');
    expect(opts.handleUploadUrl).toBe('/api/upload');
  });

  it('reports aggregate progress reaching 100% across files', async () => {
    uploadMock.mockImplementation(
      async (
        name: string,
        _file: File,
        opts: { onUploadProgress?: (e: { percentage: number }) => void }
      ) => {
        opts.onUploadProgress?.({ percentage: 100 });
        return { url: `https://store.public.blob.vercel-storage.com/${name}` };
      }
    );

    const onProgress = vi.fn();
    const files = [makeFile('a.pdf', 100), makeFile('b.pdf', 300)]; // total 400
    await uploadFilesToBlob(files, onProgress);

    expect(onProgress).toHaveBeenCalled();
    const lastCall = onProgress.mock.calls.at(-1)?.[0];
    expect(lastCall.total).toBe(400);
    expect(lastCall.percent).toBe(100);
  });

  it('returns an empty array and skips upload when there are no files', async () => {
    const refs = await uploadFilesToBlob([]);
    expect(refs).toEqual([]);
    expect(uploadMock).not.toHaveBeenCalled();
  });
});
