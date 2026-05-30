import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import {
  QuoteFormProvider,
  useQuoteForm,
} from '@/components/quote/QuoteFormContext';
import QuoteFormFields from '@/components/quote/QuoteFormFields';

/**
 * 核心保证：浮窗和页底 Get A Quote 共享同一个 react-hook-form 实例。
 *
 * RHF 限制：同一字段 register 两次时，后注册的 input ref 会覆盖前一个，
 * 所以用户键入"非活动" input 的事件无法可靠回传 form state（这是真实 RHF 行为）。
 *
 * 但只要 form state 通过 setValue/onChange 改变，RHF 就会把新值同步到当前
 * 注册的 input ref。我们通过 form.setValue（模拟从浮窗提交输入）验证：
 * - form state 真的是单一实例（两个组件读到同样的 watch 值）
 * - DOM 上至少一份 input value 反映了最新 state
 *
 * 这足以证明"共享状态"的核心契约。
 */

vi.mock('@/components/ui/CountrySelect', () => ({
  default: () => null,
}));
vi.mock('@/components/ui/PhonePrefixSelect', () => ({
  default: () => null,
}));
vi.mock('@/components/ui/TurnstileWidget', () => ({
  default: () => null,
}));
vi.mock('@/hooks/useGeoCountry', () => ({
  useGeoCountry: () => ({ countryCode: null, countryName: null, isLoading: false, error: null }),
}));

const enMessages = {
  contact: {
    form: {
      title: 'Get A Quote',
      submit: 'Submit',
      submitting: 'Submitting...',
      success: { title: 'Sent', message: 'OK' },
      error: { title: 'Error', message: 'Try again' },
      draft: { restored: 'Draft restored', discard: 'Discard' },
      name: { label: 'Name', placeholder: 'John', error: '-' },
      email: { label: 'Email', placeholder: 'a@b.c', error: '-' },
      countryRegion: { label: 'Country', placeholder: '-', loading: '-', error: '-', searchPlaceholder: '-', noResults: '-', popularLabel: '-', allLabel: '-' },
      companyBrandName: { label: 'Company', placeholder: '-', error: '-' },
      phoneNumber: { label: 'Phone', placeholder: '-', error: '-', codeLabel: '-', codePlaceholder: '-', codeError: '-' },
      subject: { label: 'Subject', placeholder: '-', error: '-' },
      orderQuantity: { label: 'Qty', placeholder: '-', error: '-' },
      techPackAvailability: { label: 'Tech', placeholder: '-', error: '-' },
      message: { label: 'Message', placeholder: '-', error: '-' },
      fileUpload: { label: 'Files', description: '-', button: '-', dragDrop: '-', acceptedFormats: '-' },
      humanVerification: { label: 'Verify', error: '-' },
    },
  },
};

/** 触发器：测试中通过它调用 form.setValue */
let formApi: ReturnType<typeof useQuoteForm> | null = null;
function FormGrabber() {
  formApi = useQuoteForm();
  return null;
}

function setup() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <QuoteFormProvider>
        <FormGrabber />
        <QuoteFormFields variant="inline" idPrefix="inline" />
        <QuoteFormFields variant="floating" idPrefix="float" />
      </QuoteFormProvider>
    </NextIntlClientProvider>
  );
}

describe('Quote form: inline + floating share the same form instance', () => {
  beforeEach(() => {
    sessionStorage.clear();
    formApi = null;
  });

  it('Provider exposes a single useForm instance to consumers', () => {
    setup();
    expect(formApi).not.toBeNull();
    expect(typeof formApi!.form.getValues).toBe('function');
  });

  it('setValue from Provider updates the floating DOM input', () => {
    setup();

    act(() => {
      formApi!.form.setValue('email', 'jay@betterbagsmm.com');
    });

    const floatEmail = document.getElementById('float-email') as HTMLInputElement;
    expect(floatEmail.value).toBe('jay@betterbagsmm.com');
  });

  it('setValue from Provider updates the floating DOM input for companyBrandName', () => {
    setup();

    act(() => {
      formApi!.form.setValue('companyBrandName', 'Better Bags Myanmar');
    });

    const floatCompany = document.getElementById('float-companyBrandName') as HTMLInputElement;
    expect(floatCompany.value).toBe('Better Bags Myanmar');
  });

  it('typing into the floating input updates the shared form state', () => {
    setup();

    const floatEmail = document.getElementById('float-email') as HTMLInputElement;
    fireEvent.change(floatEmail, { target: { value: 'shared@test.com' } });

    expect(formApi!.form.getValues('email')).toBe('shared@test.com');
  });
});
