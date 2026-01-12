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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * 联系表单 Schema
 */
export const contactFormSchema = z.object({
  // 必填字段（需求 11.2）
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

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

  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^[\d\s()+-]+$/,
      'Phone number can only contain numbers, spaces, parentheses, plus, and hyphen'
    )
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be less than 20 characters'),

  subject: z
    .string()
    .min(1, 'Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),

  message: z
    .string()
    .min(1, 'Message is required')
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be less than 2000 characters'),

  // 下拉选择字段（需求 11.3, 11.4）
  orderQuantity: z.enum(ORDER_QUANTITY_OPTIONS, {
    errorMap: () => ({ message: 'Please select an estimated order quantity' }),
  }),

  techPackAvailability: z.enum(TECH_PACK_OPTIONS, {
    errorMap: () => ({ message: 'Please select your tech pack availability' }),
  }),

  // 可选字段（需求 11.6, 11.7）
  launchTimeline: z
    .string()
    .max(200, 'Launch timeline must be less than 200 characters')
    .optional()
    .or(z.literal('')),

  specialRequests: z
    .string()
    .max(1000, 'Special requests must be less than 1000 characters')
    .optional()
    .or(z.literal('')),

  // mCaptcha token（需求 11.8）
  mcaptchaToken: z.string().min(1, 'Please complete the verification'),
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

  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
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
 * 格式化 Zod 错误为用户友好的消息
 */
export function formatZodErrors(errors: z.ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  // 防御性检查：确保 errors.errors 存在且是数组
  if (!errors || !errors.errors || !Array.isArray(errors.errors)) {
    return formattedErrors;
  }

  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(error.message);
  });

  return formattedErrors;
}
