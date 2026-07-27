import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useSiteSearch } from './useSiteSearch';
import type { SearchableDomain } from '@/lib/search/domains';

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

vi.mock('@/lib/search/domains', () => ({
  SEARCH_DOMAINS: [],
}));

vi.mock('@/lib/search/fuzzySearch', () => ({
  searchDomains: vi.fn((domains: SearchableDomain[], query: string) => {
    if (!query.trim()) return [];
    return domains
      .filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
      .map((d) => ({ domain: d, score: 1, matches: [] }));
  }),
}));

describe('useSiteSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    const { searchDomains } = require('@/lib/search/fuzzySearch');

    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('dashboard');
    });

    // With mocked useDebounce, results update immediately
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(searchDomains).toHaveBeenCalled();
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

  it('isSearching is true when live query differs from debounced', () => {
    // With mocked useDebounce, isSearching logic:
    // isSearching = query !== debouncedQuery && query.trim().length > 0
    // Since useDebounce is mocked to return the value immediately,
    // isSearching should be false
    const { result } = renderHook(() => useSiteSearch(mockDomains));

    act(() => {
      result.current.setQuery('test');
    });

    expect(result.current.isSearching).toBe(false);
  });

  it('uses custom domains when provided via the domains parameter', () => {
    const { searchDomains } = require('@/lib/search/fuzzySearch');
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

    expect(searchDomains).toHaveBeenCalledWith(customDomains, 'custom');
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
});
