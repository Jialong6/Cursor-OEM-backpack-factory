import { NextResponse } from 'next/server';
import { presignPutUrl, isR2Configured } from '@/lib/r2';
import {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  UPLOAD_KEY_PREFIX,
} from '@/lib/validations';

/**
 * 签发 Cloudflare R2 上传用的 presigned PUT URL
 *
 * 浏览器经此拿到限时 PUT URL 后，把文件直传 R2（不经过本函数，绕开 Vercel 4.5MB 限制，
 * 且 R2 bucket CORS 可控，避开 Vercel Blob 客户端直传的 CORS 死路）。
 * 这里负责：校验类型/大小、生成唯一 key。bucket 私有；邮件附件由 /api/contact 另签 GET URL。
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'Upload storage is not configured.' }, { status: 503 });
    }

    const body = (await request.json()) as {
      filename?: unknown;
      contentType?: unknown;
      size?: unknown;
    };
    const filename = typeof body.filename === 'string' ? body.filename : '';
    const contentType =
      typeof body.contentType === 'string' && body.contentType
        ? body.contentType
        : 'application/octet-stream';
    const size = typeof body.size === 'number' ? body.size : 0;

    if (!filename) {
      return NextResponse.json({ error: 'Missing filename.' }, { status: 400 });
    }
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const typeAllowed =
      ACCEPTED_FILE_TYPES.includes(contentType) || ACCEPTED_FILE_EXTENSIONS.includes(ext);
    if (!typeAllowed) {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // 唯一 key：前缀 + 随机 UUID + 安全化文件名
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
    const key = `${UPLOAD_KEY_PREFIX}${crypto.randomUUID()}-${safeName}`;
    const uploadUrl = await presignPutUrl(key, contentType);

    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create upload URL';
    console.error('[upload] presign failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
