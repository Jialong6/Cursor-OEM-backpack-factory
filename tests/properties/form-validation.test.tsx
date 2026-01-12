/**
 * 表单验证完整性属性测试
 *
 * 验证属性 10：表单验证完整性
 * 对于任意表单提交，如果任何必填字段为空或格式无效，
 * 表单应该阻止提交并显示对应字段的错误提示。
 *
 * 验证需求：11.10
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  contactFormSchema,
  ORDER_QUANTITY_OPTIONS,
  TECH_PACK_OPTIONS,
  validateFile,
  validateFiles,
  formatZodErrors,
  type ContactFormData,
} from '@/lib/validations';

// **Feature: backpack-oem-website, Property 10: 表单验证完整性**

/**
 * 生成有效的联系表单数据
 * 优化性能：使用自定义 arbitrary 直接生成有效数据，避免使用 filter
 */

// 生成有效的名字（只包含字母、空格、连字符、撇号）
// 确保至少包含一些字母，避免全是空格
const nameArbitrary = fc
  .tuple(
    fc.constantFrom(
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ),
    fc.array(
      fc.constantFrom(
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        ' ', '-', "'"
      ),
      { minLength: 1, maxLength: 49 }
    )
  )
  .map(([first, rest]) => first + rest.join(''));

// 生成有效的电话号码（只包含数字、空格、括号、加号、连字符）
// 确保至少包含一些数字
const phoneArbitrary = fc
  .tuple(
    fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
    fc.array(
      fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '(', ')', '+', '-'),
      { minLength: 9, maxLength: 19 }
    )
  )
  .map(([first, rest]) => first + rest.join(''));

// 生成非空字符串（包含至少一个非空格字符）
const nonEmptyString = (minLength: number, maxLength: number) =>
  fc
    .string({ minLength: Math.max(1, minLength), maxLength })
    .map((s) => (s.trim() === '' ? 'a'.repeat(minLength) : s));

// 生成符合 Zod 验证的简单邮箱地址
// fc.emailAddress() 可能生成 /a@a.aa 这种虽符合 RFC 但不被 Zod 接受的邮箱
const simpleEmailArbitrary = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.replace(/[^a-z0-9]/gi, 'a').slice(0, 20) || 'user'),
    fc.constantFrom('example.com', 'test.com', 'mail.com', 'email.com')
  )
  .map(([local, domain]) => `${local}@${domain}`);

const validFormDataArbitrary = fc.record({
  firstName: nameArbitrary,
  lastName: nameArbitrary,
  email: simpleEmailArbitrary,
  countryRegion: nonEmptyString(2, 100),
  companyBrandName: nonEmptyString(2, 100),
  phoneNumber: phoneArbitrary,
  subject: nonEmptyString(5, 200),
  message: nonEmptyString(20, 2000),
  orderQuantity: fc.constantFrom(...ORDER_QUANTITY_OPTIONS),
  techPackAvailability: fc.constantFrom(...TECH_PACK_OPTIONS),
  launchTimeline: fc.oneof(fc.constant(''), fc.string({ maxLength: 200 })),
  specialRequests: fc.oneof(fc.constant(''), fc.string({ maxLength: 1000 })),
  mcaptchaToken: nonEmptyString(10, 100),
});

/**
 * 必填字段列表
 */
const requiredFields = [
  'firstName',
  'lastName',
  'email',
  'countryRegion',
  'companyBrandName',
  'phoneNumber',
  'subject',
  'message',
  'orderQuantity',
  'techPackAvailability',
  'mcaptchaToken',
] as const;

describe('Property 10: 表单验证完整性', () => {
  describe('属性测试：必填字段验证', () => {
    it('任意必填字段缺失时，验证应失败', () => {
      fc.assert(
        fc.property(validFormDataArbitrary, fc.constantFrom(...requiredFields), (validData, fieldToRemove) => {
          // 创建一个副本并删除指定字段
          const invalidData = { ...validData };
          delete (invalidData as any)[fieldToRemove];

          // 验证应该失败
          const result = contactFormSchema.safeParse(invalidData);
          return !result.success;
        }),
        { numRuns: 100 }
      );
    });

    it('所有必填字段都有效时，验证应成功', () => {
      fc.assert(
        fc.property(validFormDataArbitrary, (validData) => {
          const result = contactFormSchema.safeParse(validData);
          return result.success;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('属性测试：邮箱格式验证', () => {
    it('任意无效邮箱格式应被拒绝', () => {
      fc.assert(
        fc.property(
          validFormDataArbitrary,
          fc.oneof(
            fc.constant('invalid'),
            fc.constant('invalid@'),
            fc.constant('@invalid.com'),
            fc.constant('invalid@.com'),
            fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.replace(/@/g, ''))
          ),
          (validData, invalidEmail) => {
            const invalidData = { ...validData, email: invalidEmail };
            const result = contactFormSchema.safeParse(invalidData);
            return !result.success;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('属性测试：电话号码格式验证', () => {
    it('任意包含非法字符的电话号码应被拒绝', () => {
      fc.assert(
        fc.property(
          validFormDataArbitrary,
          fc.oneof(
            fc.constant('abc123'),
            fc.constant('+1 (555) ABC-1234'),
            fc
              .tuple(phoneArbitrary, fc.constantFrom('a', 'b', 'x', 'z', '#', '@', '&'))
              .map(([phone, char]) => phone.slice(0, 15) + char)
          ),
          (validData, invalidPhone) => {
            const invalidData = { ...validData, phoneNumber: invalidPhone };
            const result = contactFormSchema.safeParse(invalidData);
            return !result.success;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('任意长度小于10的电话号码应被拒绝', () => {
      fc.assert(
        fc.property(
          validFormDataArbitrary,
          fc
            .array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '(', ')', '+', '-'), {
              minLength: 1,
              maxLength: 9,
            })
            .map((chars) => chars.join('')),
          (validData, shortPhone) => {
            const invalidData = { ...validData, phoneNumber: shortPhone };
            const result = contactFormSchema.safeParse(invalidData);
            return !result.success;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('属性测试：字符串长度限制', () => {
    it('firstName 超过最大长度时应被拒绝', () => {
      fc.assert(
        fc.property(
          validFormDataArbitrary,
          fc
            .array(
              fc.oneof(
                fc.constantFrom(
                  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
                  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
                  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                  ' ', '-', "'"
                )
              ),
              { minLength: 51, maxLength: 100 }
            )
            .map((chars) => chars.join('')),
          (validData, longFirstName) => {
            const invalidData = { ...validData, firstName: longFirstName };
            const result = contactFormSchema.safeParse(invalidData);
            return !result.success;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('message 长度小于 20 时应被拒绝', () => {
      fc.assert(
        fc.property(
          validFormDataArbitrary,
          fc.string({ minLength: 1, maxLength: 19 }),
          (validData, shortMessage) => {
            const invalidData = { ...validData, message: shortMessage };
            const result = contactFormSchema.safeParse(invalidData);
            return !result.success;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('subject 长度小于 5 时应被拒绝', () => {
      fc.assert(
        fc.property(
          validFormDataArbitrary,
          fc.string({ minLength: 1, maxLength: 4 }),
          (validData, shortSubject) => {
            const invalidData = { ...validData, subject: shortSubject };
            const result = contactFormSchema.safeParse(invalidData);
            return !result.success;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('属性测试：下拉选择字段验证', () => {
    it('任意无效的 orderQuantity 值应被拒绝', () => {
      fc.assert(
        fc.property(
          validFormDataArbitrary,
          fc.oneof(
            fc.constant('invalid option'),
            fc.constant('999 pcs'),
            fc.string({ minLength: 1, maxLength: 50 })
          ).map((s) => (ORDER_QUANTITY_OPTIONS.includes(s as any) ? s + '_invalid' : s)),
          (validData, invalidQuantity) => {
            const invalidData = { ...validData, orderQuantity: invalidQuantity };
            const result = contactFormSchema.safeParse(invalidData);
            return !result.success;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('任意无效的 techPackAvailability 值应被拒绝', () => {
      fc.assert(
        fc.property(
          validFormDataArbitrary,
          fc.oneof(
            fc.constant('invalid option'),
            fc.constant('Maybe I have it'),
            fc.string({ minLength: 1, maxLength: 50 })
          ).map((s) => (TECH_PACK_OPTIONS.includes(s as any) ? s + '_invalid' : s)),
          (validData, invalidTechPack) => {
            const invalidData = { ...validData, techPackAvailability: invalidTechPack };
            const result = contactFormSchema.safeParse(invalidData);
            return !result.success;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('属性测试：可选字段不应阻止验证', () => {
    it('launchTimeline 为空或缺失时，其他字段有效则验证应成功', () => {
      fc.assert(
        fc.property(validFormDataArbitrary, fc.constantFrom('', undefined), (validData, emptyValue) => {
          const dataWithEmptyLaunch = { ...validData, launchTimeline: emptyValue };
          const result = contactFormSchema.safeParse(dataWithEmptyLaunch);
          return result.success;
        }),
        { numRuns: 100 }
      );
    });

    it('specialRequests 为空或缺失时，其他字段有效则验证应成功', () => {
      fc.assert(
        fc.property(validFormDataArbitrary, fc.constantFrom('', undefined), (validData, emptyValue) => {
          const dataWithEmptyRequests = { ...validData, specialRequests: emptyValue };
          const result = contactFormSchema.safeParse(dataWithEmptyRequests);
          return result.success;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('属性测试：文件上传验证', () => {
    it('任意文件大小超过 10MB 应被 validateFile 拒绝', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 10 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 }),
          (fileName, fileSize) => {
            const mockFile = new File([''], fileName, {
              type: 'image/jpeg',
            });
            Object.defineProperty(mockFile, 'size', { value: fileSize });

            const result = validateFile(mockFile);
            return !result.valid && result.error !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('任意不支持的文件类型应被 validateFile 拒绝', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('text/plain', 'application/zip', 'video/mp4', 'audio/mpeg'),
          (fileName, fileType) => {
            const mockFile = new File(['test content'], fileName, {
              type: fileType,
            });
            Object.defineProperty(mockFile, 'size', { value: 1024 }); // 1KB

            const result = validateFile(mockFile);
            return !result.valid && result.error !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('任意支持的文件类型且大小小于 10MB 应被 validateFile 接受', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom(
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'application/pdf',
            'application/msword'
          ),
          fc.integer({ min: 1, max: 10 * 1024 * 1024 - 1 }),
          (fileName, fileType, fileSize) => {
            const mockFile = new File(['test content'], fileName, {
              type: fileType,
            });
            Object.defineProperty(mockFile, 'size', { value: fileSize });

            const result = validateFile(mockFile);
            return result.valid && result.error === undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('超过 5 个文件时应被 validateFiles 拒绝', () => {
      fc.assert(
        fc.property(fc.integer({ min: 6, max: 10 }), (fileCount) => {
          const mockFiles: File[] = [];
          for (let i = 0; i < fileCount; i++) {
            const file = new File(['content'], `file${i}.jpg`, {
              type: 'image/jpeg',
            });
            Object.defineProperty(file, 'size', { value: 1024 });
            mockFiles.push(file);
          }

          const result = validateFiles(mockFiles);
          return !result.valid && result.errors.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });

});

describe('Property 10: 表单验证完整性 - 单元测试补充', () => {
  describe('必填字段验证', () => {
    it('firstName 为空字符串时应失败', () => {
      const data = {
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
        countryRegion: 'USA',
        companyBrandName: 'Test Company',
        phoneNumber: '+1 555-123-4567',
        subject: 'Test inquiry',
        message: 'This is a test message with more than 20 characters',
        orderQuantity: 'Less than 100 pcs' as const,
        techPackAvailability: 'Yes, I have a tech pack' as const,
        mcaptchaToken: 'test-token-123',
      };

      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('email 为无效格式时应失败', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        countryRegion: 'USA',
        companyBrandName: 'Test Company',
        phoneNumber: '+1 555-123-4567',
        subject: 'Test inquiry',
        message: 'This is a test message with more than 20 characters',
        orderQuantity: 'Less than 100 pcs' as const,
        techPackAvailability: 'Yes, I have a tech pack' as const,
        mcaptchaToken: 'test-token-123',
      };

      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('phoneNumber 包含字母时应失败', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        countryRegion: 'USA',
        companyBrandName: 'Test Company',
        phoneNumber: 'ABC-1234567',
        subject: 'Test inquiry',
        message: 'This is a test message with more than 20 characters',
        orderQuantity: 'Less than 100 pcs' as const,
        techPackAvailability: 'Yes, I have a tech pack' as const,
        mcaptchaToken: 'test-token-123',
      };

      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('message 少于 20 个字符时应失败', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        countryRegion: 'USA',
        companyBrandName: 'Test Company',
        phoneNumber: '+1 555-123-4567',
        subject: 'Test inquiry',
        message: 'Short message',
        orderQuantity: 'Less than 100 pcs' as const,
        techPackAvailability: 'Yes, I have a tech pack' as const,
        mcaptchaToken: 'test-token-123',
      };

      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('所有必填字段有效时应成功', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        countryRegion: 'USA',
        companyBrandName: 'Test Company',
        phoneNumber: '+1 555-123-4567',
        subject: 'Test inquiry',
        message: 'This is a test message with more than 20 characters',
        orderQuantity: 'Less than 100 pcs' as const,
        techPackAvailability: 'Yes, I have a tech pack' as const,
        mcaptchaToken: 'test-token-123',
      };

      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('文件上传验证', () => {
    it('文件大小超过 10MB 应返回错误', () => {
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      const result = validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('too large');
    });

    it('不支持的文件类型应返回错误', () => {
      const unsupportedFile = new File(['content'], 'file.txt', { type: 'text/plain' });
      Object.defineProperty(unsupportedFile, 'size', { value: 1024 });

      const result = validateFile(unsupportedFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('unsupported type');
    });

    it('有效的文件应通过验证', () => {
      const validFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1 * 1024 * 1024 }); // 1MB

      const result = validateFile(validFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('超过 5 个文件应返回错误', () => {
      const files: File[] = [];
      for (let i = 0; i < 6; i++) {
        const file = new File(['content'], `file${i}.jpg`, { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 1024 });
        files.push(file);
      }

      const result = validateFiles(files);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Maximum 5 files');
    });

    it('少于 5 个有效文件应通过验证', () => {
      const files: File[] = [];
      for (let i = 0; i < 3; i++) {
        const file = new File(['content'], `file${i}.jpg`, { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 1024 });
        files.push(file);
      }

      const result = validateFiles(files);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('可选字段验证', () => {
    it('launchTimeline 为空字符串时不应影响验证', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        countryRegion: 'USA',
        companyBrandName: 'Test Company',
        phoneNumber: '+1 555-123-4567',
        subject: 'Test inquiry',
        message: 'This is a test message with more than 20 characters',
        orderQuantity: 'Less than 100 pcs' as const,
        techPackAvailability: 'Yes, I have a tech pack' as const,
        mcaptchaToken: 'test-token-123',
        launchTimeline: '',
      };

      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('specialRequests 为空字符串时不应影响验证', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        countryRegion: 'USA',
        companyBrandName: 'Test Company',
        phoneNumber: '+1 555-123-4567',
        subject: 'Test inquiry',
        message: 'This is a test message with more than 20 characters',
        orderQuantity: 'Less than 100 pcs' as const,
        techPackAvailability: 'Yes, I have a tech pack' as const,
        mcaptchaToken: 'test-token-123',
        specialRequests: '',
      };

      const result = contactFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
