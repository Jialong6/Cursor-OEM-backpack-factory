import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2（S3 兼容）服务端读写工具
 *
 * 同源中转方案：浏览器把文件「同源」上传到 /api/upload，由服务器经此模块转存 R2。
 * 浏览器不再跨域直连 R2 —— 跨域直传在 iOS Safari 上会被系统中断
 * （NSURLError -1005「网络连接已中断 / access control checks」）。
 *
 * - putObject / getObjectBytes / deleteObject：服务端←→R2（出网不受 Vercel 4.5MB 请求体限制）
 * - presignGetUrl：限时下载 URL，供 Resend 发信时远程抓取附件（URL 只需发信瞬间有效）
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
    // 路径风格 URL（<account>.r2.../<bucket>/<key>），presignGetUrl 也用它；对服务端读写无影响。
    forcePathStyle: true,
    // 关掉 AWS SDK v3.730+ 默认的自动 CRC32 校验和，签出干净 URL（服务端读写亦无害）。
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

/** 服务端写入对象到 R2（同源中转 / 分片拼接落库）。 */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const cfg = getConfig();
  if (!cfg) throw new Error('R2 is not configured');
  const client = getClient(cfg);
  await client.send(
    new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: contentType })
  );
}

/** 服务端读取对象字节（用于拼接临时分片）。 */
export async function getObjectBytes(key: string): Promise<Uint8Array> {
  const cfg = getConfig();
  if (!cfg) throw new Error('R2 is not configured');
  const client = getClient(cfg);
  const res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
  if (!res.Body) throw new Error(`R2 object has no body: ${key}`);
  return res.Body.transformToByteArray();
}

/** 服务端删除对象（清理临时分片）。 */
export async function deleteObject(key: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) throw new Error('R2 is not configured');
  const client = getClient(cfg);
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
}

/** 签发下载用 presigned GET URL（默认 1 小时有效，供 Resend 发信时抓取附件）。 */
export async function presignGetUrl(key: string, expiresIn = 3600): Promise<string> {
  const cfg = getConfig();
  if (!cfg) throw new Error('R2 is not configured');
  const client = getClient(cfg);
  const cmd = new GetObjectCommand({ Bucket: cfg.bucket, Key: key });
  return getSignedUrl(client, cmd, { expiresIn });
}
