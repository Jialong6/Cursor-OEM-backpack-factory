import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import {
  QuoteFormProvider,
  useQuoteForm,
} from '@/components/quote/QuoteFormContext';
import type { ContactFormData } from '@/lib/validations';

/**
 * 报价表单「即选即传」(eager upload)行为测试。
 *
 * mock lib/upload 的 uploadOneFile,验证:
 * - 选文件即后台启动上传,成功后该文件状态变 success 并带 key
 * - 移除文件会取消(abort)在传上传并从列表删除
 * - 提交时等上传收尾,并把已上传的 key 随 /api/contact 发出(不重复上传)
 */

const uploadOneFileMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/upload', () => ({ uploadOneFile: uploadOneFileMock }));
vi.mock('@/hooks/useGeoCountry', () => ({
  useGeoCountry: () => ({ countryCode: null, countryName: null, isLoading: false, error: null }),
}));

let api: ReturnType<typeof useQuoteForm> | null = null;
function Grab() {
  api = useQuoteForm();
  return null;
}

function setup() {
  return render(
    <NextIntlClientProvider locale="en" messages={{}}>
      <QuoteFormProvider>
        <Grab />
      </QuoteFormProvider>
    </NextIntlClientProvider>
  );
}

function changeEvent(files: File[]): React.ChangeEvent<HTMLInputElement> {
  return { target: { files, value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>;
}

function jpeg(name: string, size = 100): File {
  return new File([new Uint8Array(size)], name, { type: 'image/jpeg' });
}

const validData: ContactFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  countryRegion: 'CN',
  companyBrandName: 'Acme',
  phoneCountryCode: '',
  phoneNumber: '',
  subject: 'Inquiry',
  message: '',
  orderQuantity: '100-300 pcs',
  techPackAvailability: 'Yes, I have a tech pack',
  turnstileToken: 'token',
};

describe('Quote form: eager upload', () => {
  beforeEach(() => {
    sessionStorage.clear();
    api = null;
    uploadOneFileMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('选文件即后台上传,成功后状态变 success 带 key', async () => {
    uploadOneFileMock.mockResolvedValue({
      name: 'a.jpg',
      key: 'inquiries/k-a.jpg',
      size: 100,
      type: 'image/jpeg',
    });
    setup();

    act(() => {
      api!.handleFileChange(changeEvent([jpeg('a.jpg')]));
    });

    expect(api!.uploads.length).toBe(1);
    expect(api!.uploads[0].status).toBe('uploading');
    expect(uploadOneFileMock).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(api!.uploads[0].status).toBe('success'));
    expect(api!.uploads[0].key).toBe('inquiries/k-a.jpg');
  });

  it('移除文件会取消在传上传并从列表删除', async () => {
    let aborted = false;
    uploadOneFileMock.mockImplementation((_file: File, _onProgress: unknown, signal?: AbortSignal) => {
      signal?.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise(() => {}); // 永不 resolve,模拟在传
    });
    setup();

    act(() => {
      api!.handleFileChange(changeEvent([jpeg('a.jpg')]));
    });
    expect(api!.uploads.length).toBe(1);
    const id = api!.uploads[0].id;

    act(() => {
      api!.removeFile(id);
    });

    expect(api!.uploads.length).toBe(0);
    expect(aborted).toBe(true);
  });

  it('提交时等上传收尾,并把已上传 key 随 /api/contact 发出', async () => {
    uploadOneFileMock.mockResolvedValue({
      name: 'a.jpg',
      key: 'inquiries/k-a.jpg',
      size: 100,
      type: 'image/jpeg',
    });
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);
    setup();

    act(() => {
      api!.handleFileChange(changeEvent([jpeg('a.jpg')]));
    });
    await waitFor(() => expect(api!.uploads[0]?.status).toBe('success'));

    await act(async () => {
      await api!.onSubmit(validData);
    });

    const contactCall = fetchMock.mock.calls.find(([url]) => url === '/api/contact');
    expect(contactCall).toBeTruthy();
    const sent = JSON.parse((contactCall![1] as RequestInit).body as string);
    expect(sent.files).toEqual([
      { name: 'a.jpg', key: 'inquiries/k-a.jpg', size: 100, type: 'image/jpeg' },
    ]);
    // 提交成功后清空文件列表
    expect(api!.uploads.length).toBe(0);
  });
});
