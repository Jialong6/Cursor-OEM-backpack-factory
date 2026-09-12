'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useForm, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale } from 'next-intl';
import { contactFormSchema, type ContactFormData } from '@/lib/validations';
import {
  makeFileError,
  validateFiles,
  type FileError,
  type UploadedFileRef,
} from '@/lib/file-validation';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useGeoCountry } from '@/hooks/useGeoCountry';
import { getCountryByCode } from '@/lib/countries';
import { uploadOneFile } from '@/lib/upload';
import { useQuoteFormAnalytics } from '@/hooks/useQuoteFormAnalytics';
import type { SubmitFailureReason } from '@/lib/analytics/form-tracking';

/**
 * Get A Quote 表单的全局 Context
 *
 * 让"页底完整表单"和"右下角可拖动浮窗"共享同一份 react-hook-form
 * 实例 —— 两边的 input 通过 register() 绑定到同一个 form state，
 * 输入实时同步，提交逻辑也共享，无需任何手动同步代码。
 *
 * 文件「即选即传」：用户一选中文件就在后台并行上传到 R2（同源中转），
 * 逐文件追踪状态；提交时文件多半已传完 → 直接用 key 提交,近乎瞬时。
 */

type SubmitStatus = 'idle' | 'success' | 'error';

/** 发起提交的表单实例（页底 inline / 浮窗 floating），用于把提交反馈只显示在发起方 */
export type SubmitVariant = 'inline' | 'floating';

/** 单个文件的上传状态（即选即传） */
export interface UploadItem {
  /** 稳定 id，用于 React key 与增删/取消追踪 */
  id: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  /** 0-100 该文件上传百分比 */
  progress: number;
  /** 成功后的 R2 key */
  key?: string;
  error?: string;
}

export interface QuoteFormContextValue {
  form: UseFormReturn<ContactFormData>;
  locale: string;

  // 文件上传（即选即传）
  uploads: UploadItem[];
  /** 文件校验/上传错误(错误码 + 参数,由消费方按当前语言渲染) */
  fileErrors: FileError[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: string) => void;

  // 提交状态
  isSubmitting: boolean;
  submitStatus: SubmitStatus;
  /** 本次提交由哪个表单实例发起；提交反馈只在该实例渲染，避免双实例重复 */
  submittingVariant: SubmitVariant | null;
  onSubmit: (data: ContactFormData, variant?: SubmitVariant) => Promise<void>;
  /**
   * 提交被 zod 校验拦住时调用。这是整条漏斗里此前唯一完全观测不到的环节,
   * 而这批人恰恰是最热的线索。
   */
  onSubmitInvalid: (errors: FieldErrors<ContactFormData>, variant?: SubmitVariant) => void;
  /**
   * 最近一次提交失败的原因
   *
   * 四条路径此前全塌缩成同一个 submitStatus='error'。这里先把它们分开,
   * UI 文案本期不动 —— 拆成四态会牵动 12 个 locale JSON,PR 会失控。
   */
  lastFailureReason: SubmitFailureReason | null;

  // 草稿
  showDraftNotice: boolean;
  handleDiscardDraft: () => void;

  // Turnstile
  captchaResetSignal: number;

  // Geo
  isGeoLoading: boolean;

  // 电话区号是否被用户手动改过（控制国家联动）
  phoneCodeManuallySetRef: React.MutableRefObject<boolean>;
}

const QuoteFormContext = createContext<QuoteFormContextValue | null>(null);

export function useQuoteForm(): QuoteFormContextValue {
  const ctx = useContext(QuoteFormContext);
  if (!ctx) {
    throw new Error('useQuoteForm must be used within <QuoteFormProvider>');
  }
  return ctx;
}

export function QuoteFormProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [fileErrors, setFileErrors] = useState<FileError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submittingVariant, setSubmittingVariant] = useState<SubmitVariant | null>(null);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [lastFailureReason, setLastFailureReason] = useState<SubmitFailureReason | null>(null);

  const analytics = useQuoteFormAnalytics();

  // uploads 的 ref 镜像（事件回调里读最新值,避开闭包过期）+ 取消函数 + 在传 Promise
  const uploadsRef = useRef<UploadItem[]>([]);
  const abortMapRef = useRef<Map<string, () => void>>(new Map());
  const promiseMapRef = useRef<Map<string, Promise<UploadedFileRef>>>(new Map());

  const { countryCode: geoCountryCode, isLoading: isGeoLoading } = useGeoCountry();

  const { restoreDraft, saveDraft, clearDraft, hasDraft } = useFormDraft<ContactFormData>({
    key: 'contact-form-draft',
    excludeFields: ['turnstileToken'],
    debounceMs: 500,
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });
  const { reset, watch, setValue } = form;

  const phoneCodeManuallySetRef = useRef(false);

  // 恢复草稿
  useEffect(() => {
    const draft = restoreDraft();
    if (draft && hasDraft) {
      const allowedKeys = new Set<keyof ContactFormData>([
        'name',
        'email',
        'countryRegion',
        'companyBrandName',
        'phoneCountryCode',
        'phoneNumber',
        'subject',
        'message',
        'orderQuantity',
        'techPackAvailability',
      ]);
      Object.entries(draft).forEach(([key, value]) => {
        if (value && allowedKeys.has(key as keyof ContactFormData)) {
          setValue(key as keyof ContactFormData, value as string);
        }
      });
      if (draft.phoneCountryCode) {
        phoneCodeManuallySetRef.current = true;
      }
      setShowDraftNotice(true);
      // 草稿写入的值不算「用户开始填表」,设为基线吃掉
      analytics.setBaseline(draft as Record<string, unknown>);
    }
  }, [restoreDraft, hasDraft, setValue, analytics]);

  // Geo-IP 自动填充国家
  useEffect(() => {
    if (geoCountryCode && !watch('countryRegion')) {
      setValue('countryRegion', geoCountryCode);
    }
  }, [geoCountryCode, watch, setValue]);

  // 国家变化 → 联动电话所属国家（用户未手动改过时）
  const watchedCountry = watch('countryRegion');
  useEffect(() => {
    if (!watchedCountry) return;
    if (phoneCodeManuallySetRef.current) return;
    if (getCountryByCode(watchedCountry)) {
      setValue('phoneCountryCode', watchedCountry, { shouldValidate: false });
    }
  }, [watchedCountry, setValue]);

  // 自动保存草稿
  const watchedValues = watch();
  const saveDraftCallback = useCallback(() => {
    const hasValues = Object.entries(watchedValues).some(
      ([key, value]) => value && value !== '' && key !== 'turnstileToken'
    );
    if (hasValues) {
      saveDraft(watchedValues);
    }
  }, [watchedValues, saveDraft]);

  useEffect(() => {
    saveDraftCallback();
  }, [saveDraftCallback]);

  // 复用上面那个 watchedValues,不再新增第二个无参 watch() ——
  // react-hook-form 的无参 watch 会订阅整张表单,两个订阅等于每次击键两次全量重渲染
  useEffect(() => {
    analytics.observeValues(watchedValues as Record<string, unknown>);
  }, [watchedValues, analytics]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    reset();
    setShowDraftNotice(false);
    phoneCodeManuallySetRef.current = false;
  }, [clearDraft, reset]);

  // 同步更新 uploads 的 ref 镜像 + state
  const patchUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    uploadsRef.current = uploadsRef.current.map((u) => (u.id === id ? { ...u, ...patch } : u));
    setUploads(uploadsRef.current);
  }, []);

  // 后台启动单个文件上传（即选即传,可取消）
  const startUpload = useCallback(
    (item: UploadItem) => {
      const controller = new AbortController();
      abortMapRef.current.set(item.id, () => controller.abort());
      const denom = item.file.size || 1;
      const promise = uploadOneFile(
        item.file,
        (loaded) => patchUpload(item.id, { progress: Math.min(99, Math.round((loaded / denom) * 100)) }),
        controller.signal
      );
      promiseMapRef.current.set(item.id, promise);
      promise
        .then((ref) => patchUpload(item.id, { status: 'success', key: ref.key, progress: 100 }))
        .catch((err: unknown) => {
          if (controller.signal.aborted) return; // 主动移除,不标错
          const message = err instanceof Error ? err.message : 'upload failed';
          patchUpload(item.id, { status: 'error', error: message });
          analytics.trackFileUploadFail();
        })
        .finally(() => {
          abortMapRef.current.delete(item.id);
        });
    },
    [patchUpload, analytics]
  );

  // 选文件：追加 + 去重 + 合并校验 + 即刻并行上传新文件
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const incoming = Array.from(e.target.files || []);
      e.target.value = ''; // 允许重选同名文件
      if (incoming.length === 0) return;

      const existing = uploadsRef.current;
      const seen = new Set(existing.map((u) => `${u.file.name}:${u.file.size}`));
      const fresh = incoming.filter((f) => !seen.has(`${f.name}:${f.size}`));
      if (fresh.length === 0) {
        // 全是重复文件,静默退出 —— 这条路径对用户是黑箱,至少要能在数据里看到
        analytics.trackFileReject('duplicate');
        return;
      }

      const validation = validateFiles([...existing.map((u) => u.file), ...fresh]);
      if (!validation.valid) {
        setFileErrors(validation.errors);
        analytics.trackFileReject(validation.errors[0]?.code ?? 'invalid');
        return;
      }
      setFileErrors([]);

      const newItems: UploadItem[] = fresh.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: 'uploading',
        progress: 0,
      }));
      uploadsRef.current = [...existing, ...newItems];
      setUploads(uploadsRef.current);
      newItems.forEach(startUpload);
    },
    [startUpload, analytics]
  );

  // 移除文件：取消在传上传 + 从列表删除
  const removeFile = useCallback((id: string) => {
    abortMapRef.current.get(id)?.();
    abortMapRef.current.delete(id);
    promiseMapRef.current.delete(id);
    uploadsRef.current = uploadsRef.current.filter((u) => u.id !== id);
    setUploads(uploadsRef.current);
  }, []);

  const onSubmit = useCallback(
    async (data: ContactFormData, variant: SubmitVariant = 'inline') => {
      setIsSubmitting(true);
      setSubmitStatus('idle');
      setSubmittingVariant(variant);

      try {
        // 1) 等待「即选即传」的后台上传收尾（多半已完成 → 秒过）
        const entries = [...promiseMapRef.current.entries()];
        const settled = await Promise.allSettled(entries.map(([, p]) => p));
        const fileRefs: UploadedFileRef[] = [];
        let failed = 0;
        settled.forEach((r) => {
          if (r.status === 'fulfilled') fileRefs.push(r.value);
          else failed++;
        });
        if (failed > 0) {
          // 早退:根本没发出 POST,和服务端拒收是两回事
          setSubmitStatus('error');
          setLastFailureReason('upload_failed');
          setFileErrors([makeFileError('uploadFailed')]);
          analytics.trackSubmitFail({ variant, reason: 'upload_failed', failedFiles: failed });
          return;
        }

        // 2) 表单字段 + 已上传文件引用 以小 JSON 提交。
        //    phoneCountryCode 以 ISO 码("CN")原样发送 —— 与后端 schema 的
        //    /^[A-Z]{2}$/ 校验一致;拨号码("+86")的展示转换在服务端发邮件时再做
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, files: fileRefs, locale }),
        });
        // status 此前被丢掉了。留住它才分得清 400(校验/验证码)、429(限流)、500
        const status = response.status;
        const body = (await response.json().catch(() => null)) as { success?: boolean } | null;

        if (body?.success) {
          setSubmitStatus('success');
          clearDraft();
          setShowDraftNotice(false);
          reset();
          uploadsRef.current = [];
          setUploads([]);
          abortMapRef.current.clear();
          promiseMapRef.current.clear();
          setFileErrors([]);
          setCaptchaResetSignal((n) => n + 1);
          setLastFailureReason(null);
          analytics.trackSubmitSuccess({ variant, fileCount: fileRefs.length });
        } else {
          setSubmitStatus('error');
          setLastFailureReason('server_rejected');
          analytics.trackSubmitFail({ variant, reason: 'server_rejected', status });
        }
      } catch (err) {
        // 暴露真实错误便于诊断（上传/网络/配置等），不静默吞掉
        console.error('[QuoteForm] 提交失败:', err);
        setSubmitStatus('error');
        setLastFailureReason('network_error');
        analytics.trackSubmitFail({ variant, reason: 'network_error' });
      } finally {
        setIsSubmitting(false);
        setSubmittingVariant(null);
      }
    },
    [clearDraft, reset, locale, analytics]
  );

  const onSubmitInvalid = useCallback(
    (errors: FieldErrors<ContactFormData>, variant: SubmitVariant = 'inline') => {
      setLastFailureReason('validation');
      analytics.trackValidationBlocked(errors, variant);
    },
    [analytics]
  );

  const value: QuoteFormContextValue = {
    form,
    locale,
    uploads,
    fileErrors,
    handleFileChange,
    removeFile,
    isSubmitting,
    submitStatus,
    submittingVariant,
    onSubmit,
    onSubmitInvalid,
    lastFailureReason,
    showDraftNotice,
    handleDiscardDraft,
    captchaResetSignal,
    isGeoLoading,
    phoneCodeManuallySetRef,
  };

  return <QuoteFormContext.Provider value={value}>{children}</QuoteFormContext.Provider>;
}
