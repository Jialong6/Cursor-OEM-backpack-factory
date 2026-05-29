import { z } from 'zod';

/**
 * 联系表单数据验证 Schema
 *
 * 根据需求 11 的验收标准定义所有字段的验证规则
 * 验证需求：11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */

// 订单数量选项（需求 11.3）
export const ORDER_QUANTITY_OPTIONS = [
  'Less than 100 pcs',
  '100-300 pcs',
  '300-1000 pcs',
  'More than 1000 pcs',
] as const;

export type OrderQuantity = (typeof ORDER_QUANTITY_OPTIONS)[number];

// 技术包/样品可用性选项（需求 11.4）
export const TECH_PACK_OPTIONS = [
  'Yes, I have a tech pack',
  'I have a physical sample',
  'I only have an idea/sketch',
] as const;

export type TechPackAvailability = (typeof TECH_PACK_OPTIONS)[number];

// 文件上传验证辅助函数
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_COUNT = 5;
export const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

// 扩展名兜底白名单:部分浏览器对老 Office 格式(.xls/.ppt)给出空 MIME 或
// application/octet-stream,仅靠 MIME 会误拒,故按文件名后缀二次放行
export const ACCEPTED_FILE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
];

function hasAcceptedExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return ACCEPTED_FILE_EXTENSIONS.includes(ext);
}

/**
 * 联系表单 Schema
 */
export const contactFormSchema = z.object({
  // 必填字段（需求 11.2）
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[\p{L}\s'-]+$/u, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),

  countryRegion: z
    .string()
    .min(1, 'Country/Region is required')
    .min(2, 'Country/Region must be at least 2 characters')
    .max(100, 'Country/Region must be less than 100 characters'),

  companyBrandName: z
    .string()
    .min(1, 'Company/Brand name is required')
    .min(2, 'Company/Brand name must be at least 2 characters')
    .max(100, 'Company/Brand name must be less than 100 characters'),

  // 可选字段:电话所属国家 ISO 3166-1 alpha-2 代码(如 "CN" / "US"),与 phoneNumber 配对
  // 选用 country code 而非 dial code,避免 +1 等多国共享区号导致的歧义
  phoneCountryCode: z
    .string()
    .regex(/^[A-Z]{2}$/, 'Invalid country code')
    .optional()
    .or(z.literal('')),

  // 可选字段：电话号码(不含区号本体)
  phoneNumber: z
    .string()
    .regex(
      /^[\d\s()-]+$/,
      'Phone number can only contain numbers, spaces, parentheses, and hyphen'
    )
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be less than 20 characters')
    .optional()
    .or(z.literal('')),

  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),

  message: z
    .string()
    .max(2000, 'Message must be less than 2000 characters')
    .optional()
    .or(z.literal('')),

  // 下拉选择字段（需求 11.3, 11.4）
  orderQuantity: z.enum(ORDER_QUANTITY_OPTIONS),

  techPackAvailability: z.enum(TECH_PACK_OPTIONS),

  // Turnstile token（需求 11.8）
  turnstileToken: z.string().min(1, 'Please complete the verification before submitting'),
}).superRefine((data, ctx) => {
  // 联合校验:phoneNumber 非空时,必须有 phoneCountryCode
  if (data.phoneNumber && !data.phoneCountryCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a dial code',
      path: ['phoneCountryCode'],
    });
  }
});

/**
 * 文件上传验证 Schema（需求 11.5）
 *
 * 注意：由于 Zod 对浏览器 File 对象的支持有限，
 * 文件验证将在组件层面使用自定义逻辑处理
 */
export const fileUploadSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string(),
        size: z.number().max(MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
        type: z.string().refine(
          (type) => ACCEPTED_FILE_TYPES.includes(type),
          'File type not supported. Please upload images (JPEG, PNG, WebP) or documents (PDF, DOC, DOCX)'
        ),
      })
    )
    .max(5, 'Maximum 5 files allowed')
    .optional(),
});

// TypeScript 类型导出
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;

/**
 * 联系表单完整数据类型（包含文件）
 */
export type ContactFormWithFiles = ContactFormData & {
  files?: File[];
};

/**
 * API 响应类型
 */
export type ContactFormResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

/**
 * 验证辅助函数：检查单个文件
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (!ACCEPTED_FILE_TYPES.includes(file.type) && !hasAcceptedExtension(file.name)) {
    return {
      valid: false,
      error: `File "${file.name}" has an unsupported type. Please upload images or documents.`,
    };
  }

  return { valid: true };
}

/**
 * 验证辅助函数：检查多个文件
 */
export function validateFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length > 5) {
    errors.push('Maximum 5 files allowed');
    return { valid: false, errors };
  }

  files.forEach((file) => {
    const result = validateFile(file);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 已上传文件的引用（直传 Vercel Blob 后，前端只把元数据 + URL 发给后端）
 */
export interface UploadedFileRef {
  name: string;
  url: string;
  size: number;
  type: string;
}

// Vercel Blob 公开 URL 的主机后缀；校验 URL 必须落在该域，
// 防止客户端注入任意 URL（该 URL 会被 Resend 当作附件 path 抓取）
const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

function isValidBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * 校验直传后回传的文件引用：数量、URL 来源、大小、类型
 */
export function validateFileRefs(files: UploadedFileRef[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length > MAX_FILE_COUNT) {
    errors.push(`Maximum ${MAX_FILE_COUNT} files allowed`);
    return { valid: false, errors };
  }

  files.forEach((file) => {
    if (!isValidBlobUrl(file.url)) {
      errors.push(`File "${file.name}" has an invalid upload URL.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(
        `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !hasAcceptedExtension(file.name)) {
      errors.push(
        `File "${file.name}" has an unsupported type. Please upload images or documents.`
      );
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * 格式化 Zod 错误为用户友好的消息
 */
export function formatZodErrors(errors: z.ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  // 防御性检查：确保 errors.issues 存在且是数组
  if (!errors || !errors.issues || !Array.isArray(errors.issues)) {
    return formattedErrors;
  }

  errors.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(issue.message);
  });

  return formattedErrors;
}
