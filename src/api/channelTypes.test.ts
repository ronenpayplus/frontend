import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listChannelTypes,
  getChannelType,
  createChannelType,
  updateChannelType,
  deleteChannelType,
} from './channelTypes';

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

describe('listChannelTypes', () => {
  it('sends correct URL with default params', async () => {
    const data = { channel_types: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };
    globalThis.fetch = mockFetch(envelope(data));

    const result = await listChannelTypes();

    expect(fetch).toHaveBeenCalledTimes(1);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/v2/accounts/channel-types/list');
    expect(url).toContain('page=1');
    expect(url).toContain('page_size=20');
    expect(result.channel_types).toEqual([]);
  });

  it('sends is_active filter in query', async () => {
    const data = { channel_types: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };
    globalThis.fetch = mockFetch(envelope(data));

    await listChannelTypes({ is_active: 'true', page: 3, page_size: 25 });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('is_active=true');
    expect(url).toContain('page=3');
    expect(url).toContain('page_size=25');
  });

  it('sends search param when provided', async () => {
    const data = { channel_types: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } };
    globalThis.fetch = mockFetch(envelope(data));

    await listChannelTypes({ search: 'online' });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('search=online');
  });

  it('returns items when backend provides them', async () => {
    const items = [
      { channel_code: 'ONLINE', display_name: 'Online', is_active: true, sort_order: 1, created_at: '' },
    ];
    const data = { channel_types: items, pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 } };
    globalThis.fetch = mockFetch(envelope(data));

    const result = await listChannelTypes();
    expect(result.channel_types).toHaveLength(1);
    expect(result.channel_types[0].channel_code).toBe('ONLINE');
  });

  it('throws on HTTP error', async () => {
    globalThis.fetch = mockFetch('Not Found', false, 404);

    await expect(listChannelTypes()).rejects.toThrow('Not Found');
  });

  it('throws on API-level error status', async () => {
    const body = {
      results: { status: 'error', code: 400, description: '', message: 'invalid params' },
      data: null,
    };
    globalThis.fetch = mockFetch(body);

    await expect(listChannelTypes()).rejects.toThrow('invalid params');
  });

  it('falls back to json root when envelope.data is missing', async () => {
    const body = {
      results: { status: 'success', code: 0, description: '', message: null },
      channel_types: [{ channel_code: 'X', display_name: 'X', is_active: true, sort_order: 1, created_at: '' }],
      pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
    };
    globalThis.fetch = mockFetch(body);

    const result = await listChannelTypes();
    expect(result.channel_types).toHaveLength(1);
  });
});

describe('getChannelType', () => {
  it('calls correct URL with encoded channel code', async () => {
    const ct = { channel_code: 'ONLINE', display_name: 'Online', is_active: true, sort_order: 1, created_at: '' };
    globalThis.fetch = mockFetch(envelope({ channel_type: ct }));

    const result = await getChannelType('ONLINE');

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/v2/accounts/channel-types/get/ONLINE');
    expect(result.channel_type.channel_code).toBe('ONLINE');
  });

  it('encodes special characters in channel code', async () => {
    globalThis.fetch = mockFetch(envelope({ channel_type: {} }));

    await getChannelType('TEST/TYPE');

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('TEST%2FTYPE');
  });

  it('throws on 404', async () => {
    globalThis.fetch = mockFetch('', false, 404);

    await expect(getChannelType('NOEXIST')).rejects.toThrow();
  });
});

describe('createChannelType', () => {
  it('sends POST with correct body', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const payload = {
      channel_code: 'ONLINE',
      display_name: 'Online',
      description: 'E-commerce',
      is_active: true,
      sort_order: 1,
    };
    await createChannelType(payload);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/v2/accounts/channel-types/create');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.channel_code).toBe('ONLINE');
    expect(body.display_name).toBe('Online');
    expect(body.description).toBe('E-commerce');
  });

  it('omits optional description when undefined', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    await createChannelType({
      channel_code: 'POS',
      display_name: 'POS',
      is_active: true,
      sort_order: 1,
    });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.channel_code).toBe('POS');
    expect(body.description).toBeUndefined();
  });

  it('throws on server error', async () => {
    globalThis.fetch = mockFetch('Internal Server Error', false, 500);

    await expect(
      createChannelType({ channel_code: 'X', display_name: 'X', is_active: true, sort_order: 1 })
    ).rejects.toThrow('Internal Server Error');
  });
});

describe('updateChannelType', () => {
  it('sends PUT with channel_code in body', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const payload = {
      channel_code: 'ONLINE',
      display_name: 'Online Updated',
      description: 'Updated desc',
      is_active: true,
      sort_order: 5,
    };
    await updateChannelType('ONLINE', payload);

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/v2/accounts/channel-types/update/ONLINE');
    expect(opts.method).toBe('PUT');
    const body = JSON.parse(opts.body);
    expect(body.channel_code).toBe('ONLINE');
    expect(body.display_name).toBe('Online Updated');
    expect(body.sort_order).toBe(5);
  });

  it('falls back channel_code to URL param when body field is empty', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const payload = {
      channel_code: '',
      display_name: 'Test',
      is_active: true,
      sort_order: 1,
    };
    await updateChannelType('FALLBACK_CODE', payload);

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.channel_code).toBe('FALLBACK_CODE');
  });

  it('encodes special characters in URL', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    await updateChannelType('A&B', {
      channel_code: 'A&B',
      display_name: 'Test',
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
      updateChannelType('ONLINE', { channel_code: 'ONLINE', display_name: 'O', is_active: true, sort_order: 1 })
    ).rejects.toThrow('duplicate');
  });
});

describe('deleteChannelType', () => {
  it('sends DELETE to correct URL', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    await deleteChannelType('ONLINE');

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('/v2/accounts/channel-types/delete/ONLINE');
    expect(opts.method).toBe('DELETE');
  });

  it('encodes special characters in URL', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    await deleteChannelType('TEST CODE');

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('TEST%20CODE');
  });

  it('throws on HTTP error', async () => {
    globalThis.fetch = mockFetch('Forbidden', false, 403);

    await expect(deleteChannelType('ONLINE')).rejects.toThrow('Forbidden');
  });

  it('returns success response', async () => {
    globalThis.fetch = mockFetch(envelope({ success: true }));

    const result = await deleteChannelType('ONLINE');
    expect(result.success).toBe(true);
  });
});
