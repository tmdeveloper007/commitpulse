import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SearchableDomain } from '@/lib/search/domains';

const mockSearchDomains = vi.fn();

vi.mock('@/lib/search/fuzzySearch', () => ({
  searchDomains: (...args: unknown[]) => mockSearchDomains(...args),
}));

vi.mock('@/lib/search/domains', () => ({
  SEARCH_DOMAINS: [],
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: vi.fn((value: string, _delay: number) => value),
}));

const mockDomains: SearchableDomain[] = [
  {
    id: '1',
    title: 'Dashboard',
    description: 'Main dashboard page',
    href: '/dashboard',
    category: 'Dashboard',
    keywords: ['home', 'main'],
  },
  {
    id: '2',
    title: 'Compare',
    description: 'Compare GitHub profiles',
    href: '/compare',
    category: 'Tools',
    keywords: ['compare', 'diff'],
  },
  {
    id: '3',
    title: 'Settings',
    description: 'User settings page',
    href: '/settings',
    category: 'Dashboard',
    keywords: ['config', 'settings'],
  },
];

// Dynamically import useSiteSearch after mocks are set up
let useSiteSearch: typeof import('./useSiteSearch').useSiteSearch;

beforeEach(async () => {
  vi.clearAllMocks();
  mockSearchDomains.mockImplementation((domains: SearchableDomain[], query: string) => {
    if (!query.trim()) return [];
    return domains
      .filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
      .map((d) => ({ domain: d, score: 1, matches: [] }));
  });
  const mod = await import('./useSiteSearch');
  useSiteSearch = mod.useSiteSearch;
});

describe('useSiteSearch', () => {
  it('returns empty initial state', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.hasQuery).toBe(false);
  });

  it('setQuery updates query immediately', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('dash');
    });

    expect(result.current.query).toBe('dash');
  });

  it('hasQuery is true when query has non-whitespace content', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('test');
    });

    expect(result.current.hasQuery).toBe(true);
  });

  it('hasQuery is false for whitespace-only query', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('   ');
    });

    expect(result.current.hasQuery).toBe(false);
  });

  it('clear resets query and results', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('something');
    });

    expect(result.current.query).toBe('something');

    act(() => {
      result.current.clear();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.hasQuery).toBe(false);
  });

  it('results reflect the debounced query via searchDomains', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('dashboard');
    });

    expect(mockSearchDomains).toHaveBeenCalled();
    expect(result.current.results.length).toBeGreaterThan(0);
  });

  it('returns empty results for non-matching query', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('nonexistent');
    });

    expect(result.current.results).toEqual([]);
  });

  it('isSearching is false initially', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    expect(result.current.isSearching).toBe(false);
  });

  it('isSearching is false when query matches debounced value', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('test');
    });

    // With mocked useDebounce returning value immediately, isSearching = false
    expect(result.current.isSearching).toBe(false);
  });

  it('multiple setQuery calls update state each time', () => {
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('first');
    });
    expect(result.current.query).toBe('first');

    act(() => {
      result.current.setQuery('second');
    });
    expect(result.current.query).toBe('second');
  });

  it('uses custom domains when provided via the domains parameter', () => {
    const customDomains: SearchableDomain[] = [
      {
        id: 'custom',
        title: 'Custom Page',
        description: 'A custom domain',
        href: '/custom',
        category: 'Tools',
        keywords: [],
      },
    ];

    const { result } = renderHook(() => useSiteSearch(customDomains));

    act(() => {
      result.current.setQuery('custom');
    });

    expect(mockSearchDomains).toHaveBeenCalledWith(customDomains, 'custom');
  });
});
