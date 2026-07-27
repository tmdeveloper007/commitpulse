import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchLatestArticles } from './rss';

const { mockParseURL } = vi.hoisted(() => {
  return { mockParseURL: vi.fn() };
});

vi.mock('rss-parser', () => ({
  default: class MockParser {
    timeout = 5000;
    parseURL = mockParseURL;
  },
}));

function makeMockItem(
  overrides: Partial<{
    title: string | undefined;
    link: string | undefined;
    pubDate: string | undefined;
  }>
) {
  return {
    title: 'Test Article',
    link: 'https://example.com/article',
    pubDate: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('fetchLatestArticles', () => {
  beforeEach(() => {
    mockParseURL.mockReset();
  });

  it('parses dev.to feed and returns up to 3 articles', async () => {
    mockParseURL.mockResolvedValue({
      items: [
        makeMockItem({ title: 'Article 1', link: 'https://dev.to/a1' }),
        makeMockItem({ title: 'Article 2', link: 'https://dev.to/a2' }),
        makeMockItem({ title: 'Article 3', link: 'https://dev.to/a3' }),
        makeMockItem({ title: 'Article 4', link: 'https://dev.to/a4' }),
      ],
    });

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles).toHaveLength(3);
    expect(articles[0].title).toBe('Article 1');
    expect(articles[1].title).toBe('Article 2');
    expect(articles[2].title).toBe('Article 3');
    expect(mockParseURL).toHaveBeenCalledWith('https://dev.to/feed/testuser');
  });

  it('constructs the correct hashnode feed URL for standard username', async () => {
    mockParseURL.mockResolvedValue({ items: [] });

    await fetchLatestArticles('hashnode', 'myuser');

    expect(mockParseURL).toHaveBeenCalledWith('https://myuser.hashnode.dev/rss.xml');
  });

  it('strips .hashnode.dev suffix from hashnode username', async () => {
    mockParseURL.mockResolvedValue({ items: [] });

    await fetchLatestArticles('hashnode', 'myuser.hashnode.dev');

    expect(mockParseURL).toHaveBeenCalledWith('https://myuser.hashnode.dev/rss.xml');
  });

  it('uses custom domain URL when username contains a dot and not hashnode.dev', async () => {
    mockParseURL.mockResolvedValue({ items: [] });

    await fetchLatestArticles('hashnode', 'blog.mysite.com');

    expect(mockParseURL).toHaveBeenCalledWith('https://blog.mysite.com/rss.xml');
  });

  it('uses direct URL when username starts with https://', async () => {
    mockParseURL.mockResolvedValue({ items: [] });

    await fetchLatestArticles('hashnode', 'https://mycustom.blog/rss.xml');

    expect(mockParseURL).toHaveBeenCalledWith('https://mycustom.blog/rss.xml');
  });

  it('returns empty array on network error', async () => {
    mockParseURL.mockRejectedValue(new Error('Network error'));

    const articles = await fetchLatestArticles('devto', 'nonexistent');

    expect(articles).toEqual([]);
  });

  it('defaults title to "Untitled" when item has no title', async () => {
    mockParseURL.mockResolvedValue({
      items: [makeMockItem({ title: undefined })],
    });

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles[0].title).toBe('Untitled');
  });

  it('defaults link to empty string when item has no link', async () => {
    mockParseURL.mockResolvedValue({
      items: [makeMockItem({ link: undefined })],
    });

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles[0].link).toBe('');
  });

  it('defaults pubDate to empty string when item has no pubDate', async () => {
    mockParseURL.mockResolvedValue({
      items: [makeMockItem({ pubDate: undefined })],
    });

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles[0].pubDate).toBe('');
  });

  it('formats pubDate using toLocaleDateString', async () => {
    mockParseURL.mockResolvedValue({
      items: [makeMockItem({ pubDate: '2024-06-15T12:00:00.000Z' })],
    });

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles[0].pubDate).toBeTruthy();
    expect(typeof articles[0].pubDate).toBe('string');
  });
});
