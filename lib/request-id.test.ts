import { describe, expect, it, vi } from 'vitest';
import { getRequestId } from './request-id';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('getRequestId', () => {
  it('returns the x-request-id header value when present', async () => {
    const mockHeaders = {
      get: vi.fn((key: string) => {
        if (key === 'x-request-id') return 'req-123-abc';
        return null;
      }),
    };
    vi.mocked(require('next/headers').headers).mockResolvedValue(mockHeaders);

    const result = await getRequestId();
    expect(result).toBe('req-123-abc');
  });

  it('returns null when x-request-id header is absent', async () => {
    const mockHeaders = {
      get: vi.fn(() => null),
    };
    vi.mocked(require('next/headers').headers).mockResolvedValue(mockHeaders);

    const result = await getRequestId();
    expect(result).toBeNull();
  });

  it('returns null when headers returns empty string', async () => {
    const mockHeaders = {
      get: vi.fn(() => ''),
    };
    vi.mocked(require('next/headers').headers).mockResolvedValue(mockHeaders);

    const result = await getRequestId();
    expect(result).toBeNull();
  });

  it('calls headers with no arguments', async () => {
    const headersFn = vi.fn().mockResolvedValue({ get: vi.fn(() => null) });
    vi.mocked(require('next/headers').headers).mockImplementation(headersFn);

    await getRequestId();
    expect(headersFn).toHaveBeenCalledTimes(1);
    expect(headersFn).toHaveBeenCalledWith();
  });
});
