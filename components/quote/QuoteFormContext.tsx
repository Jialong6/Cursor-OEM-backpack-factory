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
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale } from 'next-intl';
import {
  contactFormSchema,
  validateFiles,
  type ContactFormData,
} from '@/lib/validations';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useGeoCountry } from '@/hooks/useGeoCountry';
import { getCountryByCode } from '@/lib/countries';

/**
 * Get A Quote 表单的全局 Context
 *
 * 让"页底完整表单"和"右下角可拖动浮窗"共享同一份 react-hook-form
 * 实例 —— 两边的 input 通过 register() 绑定到同一个 form state，
 * 输入实时同步，提交逻辑也共享，无需任何手动同步代码。
 */

type SubmitStatus = 'idle' | 'success' | 'error';

export interface QuoteFormContextValue {
  form: UseFormReturn<ContactFormData>;
  locale: string;

  // 文件上传
  files: File[];
  fileErrors: string[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;

  // 提交状态
  isSubmitting: boolean;
  submitStatus: SubmitStatus;
  onSubmit: (data: ContactFormData) => Promise<void>;

  // 草稿
  showDraftNotice: boolean;
  handleDiscardDraft: () => void;

  // mCaptcha
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

  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  const { countryCode: geoCountryCode, isLoading: isGeoLoading } = useGeoCountry();

  const { restoreDraft, saveDraft, clearDraft, hasDraft } = useFormDraft<ContactFormData>({
    key: 'contact-form-draft',
    excludeFields: ['mcaptchaToken'],
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
    }
  }, [restoreDraft, hasDraft, setValue]);

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
      ([key, value]) => value && value !== '' && key !== 'mcaptchaToken'
    );
    if (hasValues) {
      saveDraft(watchedValues);
    }
  }, [watchedValues, saveDraft]);

  useEffect(() => {
    saveDraftCallback();
  }, [saveDraftCallback]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    reset();
    setShowDraftNotice(false);
    phoneCodeManuallySetRef.current = false;
  }, [clearDraft, reset]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validation = validateFiles(selectedFiles);
    if (validation.valid) {
      setFiles(selectedFiles);
      setFileErrors([]);
    } else {
      setFileErrors(validation.errors);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = useCallback(
    async (data: ContactFormData) => {
      setIsSubmitting(true);
      setSubmitStatus('idle');

      try {
        // phoneCountryCode 以 ISO 码("CN")原样发送 —— 与后端 schema 的
        // /^[A-Z]{2}$/ 校验一致;拨号码("+86")的展示转换在服务端发邮件时再做
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value ?? '');
        });
        files.forEach((file) => {
          formData.append('files', file);
        });

        const response = await fetch('/api/contact', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (result.success) {
          setSubmitStatus('success');
          clearDraft();
          setShowDraftNotice(false);
          reset();
          setFiles([]);
          setCaptchaResetSignal((n) => n + 1);
        } else {
          setSubmitStatus('error');
        }
      } catch {
        setSubmitStatus('error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [files, clearDraft, reset]
  );

  const value: QuoteFormContextValue = {
    form,
    locale,
    files,
    fileErrors,
    handleFileChange,
    removeFile,
    isSubmitting,
    submitStatus,
    onSubmit,
    showDraftNotice,
    handleDiscardDraft,
    captchaResetSignal,
    isGeoLoading,
    phoneCodeManuallySetRef,
  };

  return <QuoteFormContext.Provider value={value}>{children}</QuoteFormContext.Provider>;
}
