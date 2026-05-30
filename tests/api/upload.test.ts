import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * /api/upload 路由测试（同源中转上传到 R2）
 *
 * mock @/lib/r2 的服务端读写(putObject/getObjectBytes/deleteObject/isR2Configured),
 * 覆盖:单文件直存、存分片、complete 拼接落库+清理、类型/大小/uploadId 校验、未配置 503。
 */

const r2 = vi.hoisted(() => ({
  putObject: vi.fn(async () => {}),
  getObjectBytes: vi.fn(async () => new Uint8Array()),
  deleteObject: vi.fn(async () => {}),
  isR2Configured: vi.fn(() => true),
}));
vi.mock('@/lib/r2', () => r2);

import { POST } from '@/app/api/upload/route';

const VALID_ID = '12345678-1234-4abc-8def-1234567890ab';

function req(query: string, body?: Uint8Array): Request {
  return new Request(`http://localhost/api/upload?${query}`, {
    method: 'POST',
    body: body as BodyInit | undefined,
  });
}

describe('POST /api/upload (同源中转)', () => {
  beforeEach(() => {
    r2.putObject.mockReset();
    r2.putObject.mockResolvedValue(undefined);
    r2.getObjectBytes.mockReset();
    r2.deleteObject.mockReset();
    r2.deleteObject.mockResolvedValue(undefined);
    r2.isR2Configured.mockReturnValue(true);
  });

  it('未配置 R2 时返回 503', async () => {
    r2.isR2Configured.mockReturnValueOnce(false);
    const res = await POST(req('filename=a.jpg&contentType=image/jpeg', new Uint8Array([1, 2, 3])));
    expect(res.status).toBe(503);
    expect(r2.putObject).not.toHaveBeenCalled();
  });

  it('单文件直存到 inquiries/,返回 key', async () => {
    const res = await POST(req('filename=a.jpg&contentType=image/jpeg', new Uint8Array([1, 2, 3])));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.key).toMatch(/^inquiries\/.*-a\.jpg$/);
    expect(r2.putObject).toHaveBeenCalledTimes(1);
    const [key, buf, ct] = r2.putObject.mock.calls[0];
    expect(key).toMatch(/^inquiries\//);
    expect((buf as Uint8Array).length).toBe(3);
    expect(ct).toBe('image/jpeg');
  });

  it('不支持的文件类型 → 400,不落库', async () => {
    const res = await POST(
      req('filename=a.exe&contentType=application/x-msdownload', new Uint8Array([1]))
    );
    expect(res.status).toBe(400);
    expect(r2.putObject).not.toHaveBeenCalled();
  });

  it('空文件 → 400', async () => {
    const res = await POST(req('filename=a.jpg&contentType=image/jpeg', new Uint8Array()));
    expect(res.status).toBe(400);
  });

  it('存分片到 tmp/<uploadId>/<part>', async () => {
    const res = await POST(req(`uploadId=${VALID_ID}&part=1&parts=2&size=100`, new Uint8Array([9, 9])));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(r2.putObject).toHaveBeenCalledWith(
      `tmp/${VALID_ID}/1`,
      expect.anything(),
      expect.any(String)
    );
  });

  it('非法 uploadId 被拒(防路径穿越)', async () => {
    const res = await POST(req('uploadId=../evil&part=1&parts=1&size=10', new Uint8Array([1])));
    expect(res.status).toBe(400);
    expect(r2.putObject).not.toHaveBeenCalled();
  });

  it('part 序号越界 → 400', async () => {
    const res = await POST(req(`uploadId=${VALID_ID}&part=3&parts=2&size=10`, new Uint8Array([1])));
    expect(res.status).toBe(400);
    expect(r2.putObject).not.toHaveBeenCalled();
  });

  it('complete 按序拼接落库 + 清理临时分片', async () => {
    r2.getObjectBytes.mockImplementation(async (k: string) =>
      k.endsWith('/1') ? new Uint8Array([1, 2, 3]) : new Uint8Array([4, 5])
    );
    const res = await POST(
      req(`uploadId=${VALID_ID}&complete=1&filename=big.jpg&contentType=image/jpeg&parts=2`)
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.key).toMatch(/^inquiries\/.*-big\.jpg$/);

    expect(r2.getObjectBytes).toHaveBeenCalledTimes(2);
    const putFinal = r2.putObject.mock.calls.find(([k]) => (k as string).startsWith('inquiries/'));
    expect(putFinal).toBeTruthy();
    expect((putFinal![1] as Uint8Array).length).toBe(5); // 3 + 2
    expect(r2.deleteObject).toHaveBeenCalledTimes(2); // 清理 2 个临时分片
  });

  it('complete 拼接后超过 MAX_FILE_SIZE → 400 并清理', async () => {
    r2.getObjectBytes.mockResolvedValue(new Uint8Array(6 * 1024 * 1024)); // 每片 6MB
    const res = await POST(
      req(`uploadId=${VALID_ID}&complete=1&filename=big.jpg&contentType=image/jpeg&parts=2`)
    ); // 2 * 6MB = 12MB > 10MB
    expect(res.status).toBe(400);
    expect(r2.deleteObject).toHaveBeenCalledTimes(2);
    expect(r2.putObject).not.toHaveBeenCalled();
  });
});
