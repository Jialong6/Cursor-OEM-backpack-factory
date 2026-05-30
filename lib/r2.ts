import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2（S3 兼容）presigned URL 工具
 *
 * 私有 bucket 方案：
 * - 浏览器直传用 presigned PUT URL（绕开 Vercel 4.5MB 函数体限制 + 无 Vercel Blob 的 CORS 死路）
 * - 邮件附件用限时 presigned GET URL（Resend 发信时抓取，URL 只需发信瞬间有效）
 *
 * 凭据来自运行时环境变量；未配置时 isR2Configured() 返回 false。
 */

function getConfig() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

export function isR2Configured(): boolean {
  return getConfig() !== null;
}

function getClient(cfg: NonNullable<ReturnType<typeof getConfig>>): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    // 关掉 AWS SDK v3.730+ 默认的自动 CRC32 校验和。否则 presigned PUT URL 会带上
    // x-amz-checksum-crc32 / x-amz-sdk-checksum-algorithm 查询参数，告诉 R2「期待一个
    // 校验和」，而浏览器直传不会提供 —— curl/桌面 Chrome 能容忍，但 iOS Safari 会在
    // 实际 PUT 时被 R2 中断连接（「网络连接已中断 / access control checks」）。
    // 设为 WHEN_REQUIRED 后签出干净 URL，跨浏览器（含 iOS Safari）直传才稳定。
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

/** 签发上传用 presigned PUT URL（默认 10 分钟有效）。客户端 PUT 时须带相同 Content-Type。 */
export async function presignPutUrl(
  key: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  const cfg = getConfig();
  if (!cfg) throw new Error('R2 is not configured');
  const client = getClient(cfg);
  const cmd = new PutObjectCommand({ Bucket: cfg.bucket, Key: key, ContentType: contentType });
  return getSignedUrl(client, cmd, { expiresIn });
}

/** 签发下载用 presigned GET URL（默认 1 小时有效，供 Resend 发信时抓取附件）。 */
export async function presignGetUrl(key: string, expiresIn = 3600): Promise<string> {
  const cfg = getConfig();
  if (!cfg) throw new Error('R2 is not configured');
  const client = getClient(cfg);
  const cmd = new GetObjectCommand({ Bucket: cfg.bucket, Key: key });
  return getSignedUrl(client, cmd, { expiresIn });
}
