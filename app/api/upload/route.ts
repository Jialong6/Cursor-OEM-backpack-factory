import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/validations';

/**
 * Vercel Blob 客户端直传的 token 签发路由
 *
 * 浏览器经 @vercel/blob/client 的 upload() 把文件直传到 Blob，文件本体不经过
 * 本服务函数（绕开 Vercel 4.5MB 请求体限制）。这里只负责签发受限上传 token：
 * - 限制 content-type 与单文件大小
 * - addRandomSuffix 让公开 URL 不可猜测
 *
 * 注：放行 application/octet-stream 是为兼容部分浏览器对老 Office 格式(.xls/.ppt)
 * 给出的空/通用 MIME；最终的扩展名+类型核验在 /api/contact 的 validateFileRefs 完成。
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...ACCEPTED_FILE_TYPES, 'application/octet-stream'],
        maximumSizeInBytes: MAX_FILE_SIZE,
        addRandomSuffix: true,
      }),
      // 直传完成回调：当前无需落库
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload authorization failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
