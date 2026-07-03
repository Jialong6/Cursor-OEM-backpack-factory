/**
 * 文件上传校验(客户端 + 服务端共用)
 *
 * 从 validations.ts 迁出,并把面向用户的错误改为「错误码 + 参数」结构:
 * 前端用 next-intl 按当前语言渲染(contact.form.fileUpload.errors.*),
 * 服务端(API 日志/响应)用 formatFileError 输出英文串,行为与旧版一致。
 */

// 文件上传限制(需求 11.5)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_COUNT = 5;

export const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
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
  'heic',
  'heif',
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
 * 文件校验错误码:与 locales JSON 的 contact.form.fileUpload.errors.* 一一对应
 */
export type FileErrorCode = 'tooLarge' | 'unsupportedType' | 'tooMany' | 'uploadFailed' | 'invalidRef';

export interface FileError {
  code: FileErrorCode;
  /** ICU 插值参数(与 locales 消息中的 {name}/{maxMb}/{maxCount} 对应) */
  params: { name: string; maxMb: number; maxCount: number };
}

export function makeFileError(code: FileErrorCode, name = ''): FileError {
  return {
    code,
    params: { name, maxMb: MAX_FILE_SIZE / 1024 / 1024, maxCount: MAX_FILE_COUNT },
  };
}

/**
 * 服务端/日志用:错误码 → 英文串(与历史 API 响应文案一致)
 */
export function formatFileError(error: FileError): string {
  const { name, maxMb, maxCount } = error.params;
  switch (error.code) {
    case 'tooLarge':
      return `File "${name}" is too large. Maximum size is ${maxMb}MB`;
    case 'unsupportedType':
      return `File "${name}" has an unsupported type. Please upload images or documents.`;
    case 'tooMany':
      return `Maximum ${maxCount} files allowed`;
    case 'uploadFailed':
      return 'Some files failed to upload. Please remove them and try again.';
    case 'invalidRef':
      return `File "${name}" has an invalid upload reference.`;
  }
}

/**
 * 校验单个文件(客户端「即选即传」前置检查)
 */
export function validateFile(file: File): { valid: boolean; error?: FileError } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: makeFileError('tooLarge', file.name) };
  }
  if (!ACCEPTED_FILE_TYPES.includes(file.type) && !hasAcceptedExtension(file.name)) {
    return { valid: false, error: makeFileError('unsupportedType', file.name) };
  }
  return { valid: true };
}

/**
 * 校验多个文件
 */
export function validateFiles(files: File[]): { valid: boolean; errors: FileError[] } {
  const errors: FileError[] = [];

  if (files.length > MAX_FILE_COUNT) {
    errors.push(makeFileError('tooMany'));
    return { valid: false, errors };
  }

  files.forEach((file) => {
    const result = validateFile(file);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * 已上传文件的引用(直传 R2 后,前端只把元数据 + key 发给后端)
 */
export interface UploadedFileRef {
  name: string;
  /** R2 对象 key(由 /api/upload 生成并回传) */
  key: string;
  size: number;
  type: string;
}

// 上传对象 key 的前缀(由 /api/upload 统一生成);校验客户端回传的 key 形态,
// 防止注入任意 key(key 仅在服务端用于签发 presigned GET,故只需限定前缀 + 禁止路径穿越)
export const UPLOAD_KEY_PREFIX = 'inquiries/';

/**
 * 校验直传后回传的文件引用:数量、key 形态、大小、类型
 * (服务端使用,错误为英文串,仅出现在 API 响应/日志,前端不直接渲染)
 */
export function validateFileRefs(files: UploadedFileRef[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length > MAX_FILE_COUNT) {
    errors.push(formatFileError(makeFileError('tooMany')));
    return { valid: false, errors };
  }

  files.forEach((file) => {
    if (
      typeof file.key !== 'string' ||
      !file.key.startsWith(UPLOAD_KEY_PREFIX) ||
      file.key.includes('..')
    ) {
      errors.push(formatFileError(makeFileError('invalidRef', file.name)));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(formatFileError(makeFileError('tooLarge', file.name)));
    }
    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !hasAcceptedExtension(file.name)) {
      errors.push(formatFileError(makeFileError('unsupportedType', file.name)));
    }
  });

  return { valid: errors.length === 0, errors };
}
