'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  contactFormSchema,
  ORDER_QUANTITY_OPTIONS,
  TECH_PACK_OPTIONS,
  validateFiles,
  type ContactFormData,
} from '@/lib/validations';

/**
 * 联系我们区块组件
 *
 * 功能：
 * - 展示公司联系信息（地址、电话、邮箱、WhatsApp）
 * - 实现完整的询价表单（8个必填字段 + 2个下拉选择 + 2个可选字段）
 * - 文件上传功能（最多5个文件，每个最大10MB）
 * - mCaptcha 人机验证（TODO: 需要配置 mCaptcha 账号）
 * - 表单验证和错误提示
 * - 提交成功/失败反馈
 *
 * 验证需求：11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.11
 */
export default function Contact() {
  const t = useTranslations('contact');
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 表单配置：使用 react-hook-form + Zod 验证
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validation = validateFiles(selectedFiles);

    if (validation.valid) {
      setFiles(selectedFiles);
      setFileErrors([]);
    } else {
      setFileErrors(validation.errors);
    }
  };

  // 移除已选择的文件
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 表单提交处理
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // 创建 FormData 对象
      const formData = new FormData();

      // 添加所有表单字段
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value || '');
      });

      // 添加文件
      files.forEach((file) => {
        formData.append('files', file);
      });

      // 调用 API
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        reset();
        setFiles([]);
      } else {
        console.error('Form submission failed:', result.message, result.errors);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题部分 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-xl md:text-2xl text-primary font-semibold mb-2">{t('subtitle')}</p>
          <p className="text-gray-600 max-w-2xl mx-auto">{t('intro')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：联系信息 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 地址 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('address.label')}</h3>
              <p className="text-gray-600">{t('address.value')}</p>
            </div>

            {/* 电话 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('phone.label')}</h3>
              <a href={`tel:${t('phone.value')}`} className="text-primary hover:text-primary-dark font-medium">
                {t('phone.value')}
              </a>
            </div>

            {/* 邮箱 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('email.label')}</h3>
              <a href={`mailto:${t('email.value')}`} className="text-primary hover:text-primary-dark font-medium">
                {t('email.value')}
              </a>
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('whatsapp.label')}</h3>
              <a
                href={`https://wa.me/${t('whatsapp.value').replace(/[\s()-]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark font-medium"
              >
                {t('whatsapp.value')}
              </a>
            </div>
          </div>

          {/* 右侧：表单 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('form.title')}</h3>

              {/* 成功提示 */}
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-green-800 font-semibold mb-1">{t('form.success.title')}</h4>
                  <p className="text-green-700">{t('form.success.message')}</p>
                </div>
              )}

              {/* 错误提示 */}
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-red-800 font-semibold mb-1">{t('form.error.title')}</h4>
                  <p className="text-red-700">{t('form.error.message')}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 名字 & 姓氏 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 名字 */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.firstName.label')} *
                    </label>
                    <input
                      {...register('firstName')}
                      id="firstName"
                      type="text"
                      placeholder={t('form.firstName.placeholder')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                  </div>

                  {/* 姓氏 */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.lastName.label')} *
                    </label>
                    <input
                      {...register('lastName')}
                      id="lastName"
                      type="text"
                      placeholder={t('form.lastName.placeholder')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                  </div>
                </div>

                {/* 邮箱 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.email.label')} *
                  </label>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    placeholder={t('form.email.placeholder')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                {/* 国家/地区 & 公司/品牌名称 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 国家/地区 */}
                  <div>
                    <label htmlFor="countryRegion" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.countryRegion.label')} *
                    </label>
                    <input
                      {...register('countryRegion')}
                      id="countryRegion"
                      type="text"
                      placeholder={t('form.countryRegion.placeholder')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.countryRegion ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.countryRegion && <p className="mt-1 text-sm text-red-600">{errors.countryRegion.message}</p>}
                  </div>

                  {/* 公司/品牌名称 */}
                  <div>
                    <label htmlFor="companyBrandName" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.companyBrandName.label')} *
                    </label>
                    <input
                      {...register('companyBrandName')}
                      id="companyBrandName"
                      type="text"
                      placeholder={t('form.companyBrandName.placeholder')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.companyBrandName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.companyBrandName && <p className="mt-1 text-sm text-red-600">{errors.companyBrandName.message}</p>}
                  </div>
                </div>

                {/* 电话号码 */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.phoneNumber.label')} *
                  </label>
                  <input
                    {...register('phoneNumber')}
                    id="phoneNumber"
                    type="tel"
                    placeholder={t('form.phoneNumber.placeholder')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
                </div>

                {/* 主题 */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.subject.label')} *
                  </label>
                  <input
                    {...register('subject')}
                    id="subject"
                    type="text"
                    placeholder={t('form.subject.placeholder')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.subject ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
                </div>

                {/* 订单数量 */}
                <div>
                  <label htmlFor="orderQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.orderQuantity.label')} *
                  </label>
                  <select
                    {...register('orderQuantity')}
                    id="orderQuantity"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
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
                  {errors.orderQuantity && <p className="mt-1 text-sm text-red-600">{errors.orderQuantity.message}</p>}
                </div>

                {/* 技术包可用性 */}
                <div>
                  <label htmlFor="techPackAvailability" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.techPackAvailability.label')} *
                  </label>
                  <select
                    {...register('techPackAvailability')}
                    id="techPackAvailability"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
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
                  {errors.techPackAvailability && <p className="mt-1 text-sm text-red-600">{errors.techPackAvailability.message}</p>}
                </div>

                {/* 推出时间表（可选） */}
                <div>
                  <label htmlFor="launchTimeline" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.launchTimeline.label')}
                  </label>
                  <input
                    {...register('launchTimeline')}
                    id="launchTimeline"
                    type="text"
                    placeholder={t('form.launchTimeline.placeholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* 您的消息 */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.message.label')} *
                  </label>
                  <textarea
                    {...register('message')}
                    id="message"
                    rows={6}
                    placeholder={t('form.message.placeholder')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
                </div>

                {/* 特殊要求（可选） */}
                <div>
                  <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.specialRequests.label')}
                  </label>
                  <textarea
                    {...register('specialRequests')}
                    id="specialRequests"
                    rows={3}
                    placeholder={t('form.specialRequests.placeholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                {/* 文件上传 */}
                <div>
                  <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.fileUpload.label')}
                  </label>
                  <p className="text-sm text-gray-500 mb-2">{t('form.fileUpload.description')}</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      id="fileUpload"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                      <div className="text-primary hover:text-primary-dark font-medium">{t('form.fileUpload.button')}</div>
                      <div className="text-sm text-gray-500 mt-1">{t('form.fileUpload.dragDrop')}</div>
                      <div className="text-xs text-gray-400 mt-2">{t('form.fileUpload.acceptedFormats')}</div>
                    </label>
                  </div>

                  {/* 文件列表 */}
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 文件错误 */}
                  {fileErrors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {fileErrors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* mCaptcha 占位符 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Human Verification *</label>
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center text-gray-500">
                    {/* TODO: 集成 mCaptcha */}
                    <p className="text-sm">mCaptcha verification will be integrated here</p>
                  </div>
                  <input {...register('mcaptchaToken')} type="hidden" value="test-token-placeholder" />
                </div>

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('form.submitting') : t('form.submit')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
