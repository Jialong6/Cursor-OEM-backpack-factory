import { NextResponse } from 'next/server';
import { putObject, getObjectBytes, deleteObject, isR2Configured } from '@/lib/r2';
import {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  UPLOAD_KEY_PREFIX,
} from '@/lib/validations';

/**
 * 同源文件中转上传到 Cloudflare R2
 *
 * 浏览器把文件「同源」POST 到本接口（不再跨域直连 R2 —— 跨域直传在 iOS Safari 上会被
 * 系统中断）；本函数把字节转存 R2。受 Vercel 单请求体 4.5MB 限制，故大文件由客户端切成
 * ≤4MB 分片逐片上传，最后一次 complete 请求在服务端按序拼接成完整对象再落库。
 *
 * 协议（query 参数 + raw body）：
 * - 单文件：POST ?filename=&contentType=  body=文件字节         → 落 inquiries/<uuid>-<name>
 * - 存分片：POST ?uploadId=&part=N&parts=M&size=  body=分片字节  → 落 tmp/<uploadId>/<N>
 * - 完成：  POST ?uploadId=&complete=1&filename=&contentType=&parts=M  body 空 → 拼接落库 + 清理
 */

export const runtime = 'nodejs';

const TMP_PREFIX = 'tmp/';
const MAX_PARTS = 32;
// uploadId 仅允许 UUID 字符，杜绝 tmp/<uploadId>/ 的路径穿越
const UUID_RE = /^[a-f0-9-]{36}$/;

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function isTypeAllowed(filename: string, contentType: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return ACCEPTED_FILE_TYPES.includes(contentType) || ACCEPTED_FILE_EXTENSIONS.includes(ext);
}

/** 生成最终对象 key：前缀 + 随机 UUID + 安全化文件名 */
function finalKey(filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  return `${UPLOAD_KEY_PREFIX}${crypto.randomUUID()}-${safeName}`;
}

function maxMb(): number {
  return MAX_FILE_SIZE / 1024 / 1024;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!isR2Configured()) {
      return jsonError('Upload storage is not configured.', 503);
    }

    const q = new URL(request.url).searchParams;
    const uploadId = q.get('uploadId') ?? '';

    if (uploadId && q.get('complete') === '1') return handleComplete(uploadId, q);
    if (uploadId) return handleChunk(uploadId, q, request);
    return handleSingle(q, request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('[upload] failed:', message);
    return jsonError(message, 500);
  }
}

/** 模式 1：小文件（≤4MB）单请求直存。 */
async function handleSingle(q: URLSearchParams, request: Request): Promise<NextResponse> {
  const filename = q.get('filename') ?? '';
  const contentType = q.get('contentType') || 'application/octet-stream';
  if (!filename) return jsonError('Missing filename.', 400);
  if (!isTypeAllowed(filename, contentType)) return jsonError('Unsupported file type.', 400);

  const buf = Buffer.from(await request.arrayBuffer());
  if (buf.length === 0) return jsonError('Empty file.', 400);
  if (buf.length > MAX_FILE_SIZE) return jsonError(`File too large. Max ${maxMb()}MB.`, 400);

  const key = finalKey(filename);
  await putObject(key, buf, contentType);
  return NextResponse.json({ key });
}

/** 模式 2：存一个临时分片到 tmp/<uploadId>/<part>。 */
async function handleChunk(
  uploadId: string,
  q: URLSearchParams,
  request: Request
): Promise<NextResponse> {
  if (!UUID_RE.test(uploadId)) return jsonError('Invalid uploadId.', 400);
  const part = Number(q.get('part'));
  const parts = Number(q.get('parts'));
  const totalSize = Number(q.get('size'));
  if (!Number.isInteger(part) || part < 1 || part > MAX_PARTS) return jsonError('Invalid part.', 400);
  if (!Number.isInteger(parts) || parts < 1 || parts > MAX_PARTS || part > parts)
    return jsonError('Invalid parts.', 400);
  if (Number.isFinite(totalSize) && totalSize > MAX_FILE_SIZE)
    return jsonError(`File too large. Max ${maxMb()}MB.`, 400);

  const buf = Buffer.from(await request.arrayBuffer());
  if (buf.length === 0) return jsonError('Empty chunk.', 400);
  if (buf.length > MAX_FILE_SIZE) return jsonError('Chunk too large.', 400);

  await putObject(`${TMP_PREFIX}${uploadId}/${part}`, buf, 'application/octet-stream');
  return NextResponse.json({ ok: true, part });
}

/** 模式 3：按序读回各分片，拼接成完整对象落库，并清理临时分片。 */
async function handleComplete(uploadId: string, q: URLSearchParams): Promise<NextResponse> {
  if (!UUID_RE.test(uploadId)) return jsonError('Invalid uploadId.', 400);
  const filename = q.get('filename') ?? '';
  const contentType = q.get('contentType') || 'application/octet-stream';
  const parts = Number(q.get('parts'));
  if (!filename) return jsonError('Missing filename.', 400);
  if (!isTypeAllowed(filename, contentType)) return jsonError('Unsupported file type.', 400);
  if (!Number.isInteger(parts) || parts < 1 || parts > MAX_PARTS)
    return jsonError('Invalid parts.', 400);

  const tmpKeys = Array.from({ length: parts }, (_, i) => `${TMP_PREFIX}${uploadId}/${i + 1}`);
  const cleanup = () => Promise.allSettled(tmpKeys.map((k) => deleteObject(k)));

  const buffers: Buffer[] = [];
  for (const k of tmpKeys) {
    const bytes = await getObjectBytes(k); // 缺片 → 抛错 → 外层 500
    buffers.push(Buffer.from(bytes));
  }
  const combined = Buffer.concat(buffers);

  if (combined.length === 0) {
    await cleanup();
    return jsonError('Empty upload.', 400);
  }
  if (combined.length > MAX_FILE_SIZE) {
    await cleanup();
    return jsonError(`File too large. Max ${maxMb()}MB.`, 400);
  }

  const key = finalKey(filename);
  await putObject(key, combined, contentType);
  await cleanup(); // 清理失败不阻断；R2 生命周期规则兜底
  return NextResponse.json({ key });
}
