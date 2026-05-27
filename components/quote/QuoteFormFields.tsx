'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ORDER_QUANTITY_OPTIONS,
  TECH_PACK_OPTIONS,
} from '@/lib/validations';
import CountrySelect from '@/components/ui/CountrySelect';
import PhonePrefixSelect from '@/components/ui/PhonePrefixSelect';
import MCaptchaWidget from '@/components/ui/MCaptchaWidget';
import { useQuoteForm } from './QuoteFormContext';
import { getLocalExampleNumber } from '@/lib/phone-examples';

const MCAPTCHA_INSTANCE_URL = process.env.NEXT_PUBLIC_MCAPTCHA_INSTANCE_URL || '';
const MCAPTCHA_SITEKEY = process.env.NEXT_PUBLIC_MCAPTCHA_SITEKEY || '';

interface QuoteFormFieldsProps {
  /**
   * inline = 页底完整版（padding 大、字号常规）
   * floating = 浮窗紧凑版（padding 小、间距紧凑）
   */
  variant?: 'inline' | 'floating';
  /** 字段 id 前缀，避免 inline / floating 同时在 DOM 时 id 冲突 */
  idPrefix?: string;
}

export default function QuoteFormFields({
  variant = 'inline',
  idPrefix = '',
}: QuoteFormFieldsProps) {
  const t = useTranslations('contact');
  const {
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
  } = useQuoteForm();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const id = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);
  const spacing = variant === 'floating' ? 'space-y-4' : 'space-y-6';
  const pad = variant === 'floating' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2';

  // phoneNumber 占位符按当前电话国家动态切换
  const watchedPhoneCountry = watch('phoneCountryCode') || '';
  const phonePlaceholder = useMemo(() => {
    const ex = getLocalExampleNumber(watchedPhoneCountry);
    return ex ? `e.g. ${ex}` : t('form.phoneNumber.placeholder');
  }, [watchedPhoneCountry, t]);

  // message 自适应高度
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const watchedMessage = watch('message');
  useEffect(() => {
    const el = messageTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [watchedMessage]);

  return (
    <>
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" role="alert" aria-live="polite">
          <h4 className="text-green-800 font-semibold mb-1">{t('form.success.title')}</h4>
          <p className="text-green-700">{t('form.success.message')}</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
          <h4 className="text-red-800 font-semibold mb-1">{t('form.error.title')}</h4>
          <p className="text-red-700">{t('form.error.message')}</p>
        </div>
      )}

      {showDraftNotice && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between" role="status" aria-live="polite">
          <p className="text-blue-700">{t('form.draft.restored')}</p>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            {t('form.draft.discard')}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={spacing}>
        {/* 姓名 */}
        <div>
          <label htmlFor={id('name')} className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.name.label')} *
          </label>
          <input
            {...register('name')}
            id={id('name')}
            type="text"
            placeholder={t('form.name.placeholder')}
            aria-required="true"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? `${id('name')}-error` : undefined}
            className={`w-full ${pad} border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p id={`${id('name')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.name.error')}
            </p>
          )}
        </div>

        {/* 邮箱 */}
        <div>
          <label htmlFor={id('email')} className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.email.label')} *
          </label>
          <input
            {...register('email')}
            id={id('email')}
            type="email"
            placeholder={t('form.email.placeholder')}
            aria-required="true"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? `${id('email')}-error` : undefined}
            className={`w-full ${pad} border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p id={`${id('email')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.email.error')}
            </p>
          )}
        </div>

        {/* 国家/地区 & 公司/品牌名称 */}
        <div className={variant === 'floating' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
          <div>
            <label htmlFor={id('countryRegion')} className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.countryRegion.label')} *
            </label>
            <CountrySelect
              id={id('countryRegion')}
              value={watch('countryRegion') || ''}
              onChange={(value) => setValue('countryRegion', value, { shouldValidate: true })}
              placeholder={t('form.countryRegion.placeholder')}
              hasError={!!errors.countryRegion}
              errorId={`${id('countryRegion')}-error`}
              isLoading={isGeoLoading}
              loadingText={t('form.countryRegion.loading')}
              locale={locale}
              searchPlaceholder={t('form.countryRegion.searchPlaceholder')}
              noResultsText={t('form.countryRegion.noResults')}
              popularLabel={t('form.countryRegion.popularLabel')}
              allLabel={t('form.countryRegion.allLabel')}
              required
            />
            <input type="hidden" {...register('countryRegion')} />
            {errors.countryRegion && (
              <p id={`${id('countryRegion')}-error`} className="mt-1 text-sm text-red-600" role="alert">
                {t('form.countryRegion.error')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={id('companyBrandName')} className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.companyBrandName.label')} *
            </label>
            <input
              {...register('companyBrandName')}
              id={id('companyBrandName')}
              type="text"
              placeholder={t('form.companyBrandName.placeholder')}
              aria-required="true"
              aria-invalid={errors.companyBrandName ? 'true' : 'false'}
              aria-describedby={errors.companyBrandName ? `${id('companyBrandName')}-error` : undefined}
              className={`w-full ${pad} border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.companyBrandName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.companyBrandName && (
              <p id={`${id('companyBrandName')}-error`} className="mt-1 text-sm text-red-600" role="alert">
                {t('form.companyBrandName.error')}
              </p>
            )}
          </div>
        </div>

        {/* 电话号码（可选） */}
        <div>
          <label htmlFor={id('phoneNumber')} className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.phoneNumber.label')}
          </label>
          <div className="flex items-stretch gap-2">
            <div className="w-32 shrink-0">
              <PhonePrefixSelect
                id={id('phoneCountryCode')}
                value={watch('phoneCountryCode') || ''}
                onChange={(dial) => {
                  phoneCodeManuallySetRef.current = true;
                  setValue('phoneCountryCode', dial, { shouldValidate: true });
                }}
                locale={locale}
                hasError={!!errors.phoneCountryCode}
                errorId={`${id('phoneCountryCode')}-error`}
                ariaLabel={t('form.phoneNumber.codeLabel')}
                placeholder={t('form.phoneNumber.codePlaceholder')}
                searchPlaceholder={t('form.countryRegion.searchPlaceholder')}
                noResultsText={t('form.countryRegion.noResults')}
                popularLabel={t('form.countryRegion.popularLabel')}
                allLabel={t('form.countryRegion.allLabel')}
              />
              <input type="hidden" {...register('phoneCountryCode')} />
            </div>
            <input
              {...register('phoneNumber')}
              id={id('phoneNumber')}
              type="tel"
              placeholder={phonePlaceholder}
              aria-invalid={errors.phoneNumber ? 'true' : 'false'}
              aria-describedby={errors.phoneNumber ? `${id('phoneNumber')}-error` : undefined}
              className={`flex-1 min-w-0 ${pad} border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.phoneCountryCode && (
            <p id={`${id('phoneCountryCode')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.phoneNumber.codeError')}
            </p>
          )}
          {errors.phoneNumber && (
            <p id={`${id('phoneNumber')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.phoneNumber.error')}
            </p>
          )}
        </div>

        {/* 主题 */}
        <div>
          <label htmlFor={id('subject')} className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.subject.label')} *
          </label>
          <input
            {...register('subject')}
            id={id('subject')}
            type="text"
            placeholder={t('form.subject.placeholder')}
            aria-required="true"
            aria-invalid={errors.subject ? 'true' : 'false'}
            aria-describedby={errors.subject ? `${id('subject')}-error` : undefined}
            className={`w-full ${pad} border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.subject ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.subject && (
            <p id={`${id('subject')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.subject.error')}
            </p>
          )}
        </div>

        {/* 订单数量 */}
        <div>
          <label htmlFor={id('orderQuantity')} className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.orderQuantity.label')} *
          </label>
          <select
            {...register('orderQuantity')}
            id={id('orderQuantity')}
            aria-required="true"
            aria-invalid={errors.orderQuantity ? 'true' : 'false'}
            aria-describedby={errors.orderQuantity ? `${id('orderQuantity')}-error` : undefined}
            className={`w-full ${pad} border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.orderQuantity ? 'border-red-500' : 'border-gray-300'
            }`}
            defaultValue=""
          >
            <option value="" disabled>
              {t('form.orderQuantity.placeholder')}
            </option>
            {ORDER_QUANTITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.orderQuantity && (
            <p id={`${id('orderQuantity')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.orderQuantity.error')}
            </p>
          )}
        </div>

        {/* 技术包可用性 */}
        <div>
          <label htmlFor={id('techPackAvailability')} className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.techPackAvailability.label')} *
          </label>
          <select
            {...register('techPackAvailability')}
            id={id('techPackAvailability')}
            aria-required="true"
            aria-invalid={errors.techPackAvailability ? 'true' : 'false'}
            aria-describedby={errors.techPackAvailability ? `${id('techPackAvailability')}-error` : undefined}
            className={`w-full ${pad} border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.techPackAvailability ? 'border-red-500' : 'border-gray-300'
            }`}
            defaultValue=""
          >
            <option value="" disabled>
              {t('form.techPackAvailability.placeholder')}
            </option>
            {TECH_PACK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.techPackAvailability && (
            <p id={`${id('techPackAvailability')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.techPackAvailability.error')}
            </p>
          )}
        </div>

        {/* 您的消息 */}
        <div>
          <label htmlFor={id('message')} className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.message.label')} *
          </label>
          {(() => {
            const { ref: rhfRef, ...rest } = register('message');
            return (
              <textarea
                {...rest}
                ref={(el) => {
                  rhfRef(el);
                  messageTextareaRef.current = el;
                }}
                id={id('message')}
                rows={2}
                placeholder={t('form.message.placeholder')}
                aria-required="true"
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? `${id('message')}-error` : undefined}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${el.scrollHeight}px`;
                }}
                className={`w-full ${pad} border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none overflow-y-auto max-h-64 ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            );
          })()}
          {errors.message && (
            <p id={`${id('message')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.message.error')}
            </p>
          )}
        </div>

        {/* 文件上传 */}
        <div>
          <label htmlFor={id('fileUpload')} className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.fileUpload.label')}
          </label>
          <p className="text-sm text-gray-500 mb-2">{t('form.fileUpload.description')}</p>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
            <input
              id={id('fileUpload')}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label={t('form.fileUpload.label')}
            />
            <div className="pointer-events-none">
              <div className="text-primary font-medium">{t('form.fileUpload.button')}</div>
              <div className="text-sm text-gray-500 mt-1">{t('form.fileUpload.dragDrop')}</div>
              <div className="text-xs text-gray-400 mt-2">{t('form.fileUpload.acceptedFormats')}</div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-3 space-y-2" role="list" aria-label="Uploaded files">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded" role="listitem">
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                    aria-label={`Remove file ${file.name}`}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          {fileErrors.length > 0 && (
            <div className="mt-2 space-y-1" role="alert" aria-live="assertive">
              {fileErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* 人机验证 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.humanVerification.label')} *
          </label>
          <MCaptchaWidget
            instanceUrl={MCAPTCHA_INSTANCE_URL}
            siteKey={MCAPTCHA_SITEKEY}
            resetSignal={captchaResetSignal}
            onVerify={(token) => setValue('mcaptchaToken', token, { shouldValidate: true })}
            onError={() => setValue('mcaptchaToken', '', { shouldValidate: true })}
          />
          <input type="hidden" {...register('mcaptchaToken')} />
          {errors.mcaptchaToken && (
            <p id={`${id('mcaptchaToken')}-error`} className="mt-1 text-sm text-red-600" role="alert">
              {t('form.humanVerification.error')}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('form.submitting') : t('form.submit')}
        </button>
      </form>
    </>
  );
}
