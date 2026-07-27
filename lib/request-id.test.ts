import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getRequestId } from './request-id';

const mockHeadersFn = vi.fn();

vi.mock('next/headers', () => ({
  headers: () => mockHeadersFn(),
}));

describe('getRequestId', () => {
  beforeEach(() => {
    mockHeadersFn.mockClear();
  });

  it('returns the x-request-id header value when present', async () => {
    mockHeadersFn.mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'x-request-id') return 'req-123-abc';
        return null;
      }),
    });

    const result = await getRequestId();
    expect(result).toBe('req-123-abc');
  });

  it('returns null when x-request-id header is absent', async () => {
    mockHeadersFn.mockResolvedValue({
      get: vi.fn(() => null),
    });

    const result = await getRequestId();
    expect(result).toBeNull();
  });

  it('returns empty string when header value is empty string', async () => {
    mockHeadersFn.mockResolvedValue({
      get: vi.fn(() => ''),
    });

    const result = await getRequestId();
    expect(result).toBe('');
  });

  it('calls headers() to get request headers', async () => {
    mockHeadersFn.mockResolvedValue({
      get: vi.fn(() => null),
    });

    await getRequestId();
    expect(mockHeadersFn).toHaveBeenCalledTimes(1);
  });
});
