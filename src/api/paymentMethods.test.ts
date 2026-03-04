import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listPaymentMethods,
  getPaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from './paymentMethods';

function envelope<T>(data: T) {
  return {
    results: { status: 'success', code: 0, description: '', message: null },
    data,
  };
}

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('listPaymentMethods', () => {
  it('sends correct URL with default params', async () => {
    const data = { payment_methods: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };
    globalThis.fetch = mockFetch(envelope(data));

    const result = await listPaymentMethods();

    expect(fetch).toHaveBeenCalledTimes(1);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/v2/companies/payment-methods/list');
    expect(url).toContain('page=1');
    expect(url).toContain('page_size=20');
    expect(result.payment_methods).toEqual([]);
  });

  it('sends category and is_active filters in query', async () => {
    const data = { payment_methods: [], pagination: { page: 1, page_size: 50, total: 0, total_pages: 0 } };
    globalThis.fetch = mockFetch(envelope(data));

    await listPaymentMethods({ category: 'CARD', is_active: 'true', page: 2, page_size: 50 });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('category=CARD');
    expect(url).toContain('is_active=true');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=50');
  });

  it('sends search param when provided', async () => {
    const data = { payment_methods: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };
    globalThis.fetch = mockFetch(envelope(data));

    await listPaymentMethods({ search: 'visa' });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('search=visa');
  });

  it('returns items when backend provides them', async () => {
    const items = [
      { method_code: 'VISA', display_name: 'Visa', category: 'CARD', is_active: true, sort_order: 1, created_at: '' },
    ];
    const data = { payment_methods: items, pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 } };
    globalThis.fetch = mockFetch(envelope(data));

    const result = await listPaymentMethods();
    expect(result.payment_methods).toHaveLength(1);
    expect(result.payment_methods[0].method_code).toBe('VISA');
  });

  it('throws on HTTP error', async () => {
    globalThis.fetch = mockFetch('Not Found', false, 404);

    await expect(listPaymentMethods()).rejects.toThrow('Not Found');
  });

  it('throws on API-level error status', async () => {
    const body = {
      results: { status: 'error', code: 400, description: '', message: 'bad request' },
      data: null,
    };
    globalThis.fetch = mockFetch(body);

    await expect(listPaymentMethods()).rejects.toThrow('bad request');
  });

  it('falls back to json root when envelope.data is missing', async () => {
    const body = {
      results: { status: 'success', code: 0, description: '', message: null },
      payment_methods: [{ method_code: 'X', display_name: 'X', category: 'OTHER', is_active: true, sort_order: 1, created_at: '' }],
      pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    };
    globalThis.fetch = mockFetch(body);

    const result = await listPaymentMethods();
    expect(result.payment_methods).toHaveLength(1);
  });
});

describe('getPaymentMethod', () => {
  it('calls correct URL with encoded method code', async () => {
    const pm = { method_code: 'APPLE_PAY', display_name: 'Apple Pay', category: 'WALLET', is_active: true, sort_order: 10, created_at: '' };
    globalThis.fetch = mockFetch(envelope({ payment_method: pm }));

    const result = await getPaymentMethod('APPLE_PAY');

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/v2/companies/payment-methods/get/APPLE_PAY');
    expect(result.payment_method.method_code).toBe('APPLE_PAY');
  });

  it('encodes special characters in method code', async () => {
    globalThis.fetch = mockFetch(envelope({ payment_method: {} }));

    await getPaymentMethod('TEST/CODE');

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('TEST%2FCODE');
  });

  it('throws on 404', async () => {
    globalThis.fetch = mockFetch('', false, 404);

    await expect(getPaymentMethod('NOEXIST')).rejects.toThrow();
  });
});

describe('createPaymentMethod', () => {
  it('sends POST with correct body', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const payload = {
      method_code: 'VISA',
      display_name: 'Visa',
      category: 'CARD' as const,
      is_active: true,
      sort_order: 1,
    };
    await createPaymentMethod(payload);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/v2/companies/payment-methods/create');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.method_code).toBe('VISA');
    expect(body.display_name).toBe('Visa');
    expect(body.category).toBe('CARD');
  });

  it('includes optional fields when provided', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const payload = {
      method_code: 'VISA',
      display_name: 'Visa',
      category: 'CARD' as const,
      brand: 'VISA',
      is_active: true,
      sort_order: 1,
      metadata: { network: 'visa' },
    };
    await createPaymentMethod(payload);

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.brand).toBe('VISA');
    expect(body.metadata).toEqual({ network: 'visa' });
  });

  it('throws on server error', async () => {
    globalThis.fetch = mockFetch('Internal Server Error', false, 500);

    await expect(
      createPaymentMethod({ method_code: 'X', display_name: 'X', category: 'OTHER', is_active: true, sort_order: 1 })
    ).rejects.toThrow('Internal Server Error');
  });
});

describe('updatePaymentMethod', () => {
  it('sends PUT with method_code in body', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const payload = {
      method_code: 'VISA',
      display_name: 'Visa Updated',
      category: 'CARD' as const,
      is_active: true,
      sort_order: 2,
    };
    await updatePaymentMethod('VISA', payload);

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/v2/companies/payment-methods/update/VISA');
    expect(opts.method).toBe('PUT');
    const body = JSON.parse(opts.body);
    expect(body.method_code).toBe('VISA');
    expect(body.display_name).toBe('Visa Updated');
    expect(body.sort_order).toBe(2);
  });

  it('falls back method_code to URL param when body field is empty', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const payload = {
      method_code: '',
      display_name: 'Test',
      category: 'OTHER' as const,
      is_active: true,
      sort_order: 1,
    };
    await updatePaymentMethod('FALLBACK_CODE', payload);

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.method_code).toBe('FALLBACK_CODE');
  });

  it('encodes special characters in URL', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    await updatePaymentMethod('A&B', {
      method_code: 'A&B',
      display_name: 'Test',
      category: 'OTHER' as const,
      is_active: true,
      sort_order: 1,
    });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('A%26B');
  });

  it('throws on API error', async () => {
    const body = {
      results: { status: 'error', code: 409, description: '', message: 'duplicate' },
      data: null,
    };
    globalThis.fetch = mockFetch(body);

    await expect(
      updatePaymentMethod('VISA', { method_code: 'VISA', display_name: 'V', category: 'CARD', is_active: true, sort_order: 1 })
    ).rejects.toThrow('duplicate');
  });
});

describe('deletePaymentMethod', () => {
  it('sends DELETE to correct URL', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    await deletePaymentMethod('VISA');

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/v2/companies/payment-methods/delete/VISA');
    expect(opts.method).toBe('DELETE');
  });

  it('encodes special characters in URL', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    await deletePaymentMethod('TEST CODE');

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('TEST%20CODE');
  });

  it('throws on HTTP error', async () => {
    globalThis.fetch = mockFetch('Forbidden', false, 403);

    await expect(deletePaymentMethod('VISA')).rejects.toThrow('Forbidden');
  });

  it('returns success response', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const result = await deletePaymentMethod('VISA');
    expect(result.success).toBe(true);
  });
});
