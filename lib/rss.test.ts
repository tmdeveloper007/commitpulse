import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchLatestArticles } from './rss';

vi.mock('rss-parser', () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: vi.fn(),
  })),
}));

function makeMockItem(overrides: Partial<{
  title: string | undefined;
  link: string | undefined;
  pubDate: string | undefined;
}>) {
  return {
    title: 'Test Article',
    link: 'https://example.com/article',
    pubDate: '2024-01-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('fetchLatestArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses dev.to feed and returns up to 3 articles', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({
        items: [
          makeMockItem({ title: 'Article 1', link: 'https://dev.to/a1' }),
          makeMockItem({ title: 'Article 2', link: 'https://dev.to/a2' }),
          makeMockItem({ title: 'Article 3', link: 'https://dev.to/a3' }),
          makeMockItem({ title: 'Article 4', link: 'https://dev.to/a4' }),
        ],
      }),
    };
    Parser.mockImplementation(() => mockParser);

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles).toHaveLength(3);
    expect(articles[0].title).toBe('Article 1');
    expect(articles[1].title).toBe('Article 2');
    expect(articles[2].title).toBe('Article 3');
    expect(mockParser.parseURL).toHaveBeenCalledWith('https://dev.to/feed/testuser');
  });

  it('constructs the correct hashnode feed URL for standard username', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({ items: [] }),
    };
    Parser.mockImplementation(() => mockParser);

    await fetchLatestArticles('hashnode', 'myuser');

    expect(mockParser.parseURL).toHaveBeenCalledWith('https://myuser.hashnode.dev/rss.xml');
  });

  it('strips .hashnode.dev suffix from hashnode username', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({ items: [] }),
    };
    Parser.mockImplementation(() => mockParser);

    await fetchLatestArticles('hashnode', 'myuser.hashnode.dev');

    expect(mockParser.parseURL).toHaveBeenCalledWith('https://myuser.hashnode.dev/rss.xml');
  });

  it('uses custom domain URL when username looks like a custom domain', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({ items: [] }),
    };
    Parser.mockImplementation(() => mockParser);

    await fetchLatestArticles('hashnode', 'blog.mysite.com');

    expect(mockParser.parseURL).toHaveBeenCalledWith('https://blog.mysite.com/rss.xml');
  });

  it('uses direct URL when username starts with http', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({ items: [] }),
    };
    Parser.mockImplementation(() => mockParser);

    await fetchLatestArticles('hashnode', 'https://mycustom.blog/rss.xml');

    expect(mockParser.parseURL).toHaveBeenCalledWith('https://mycustom.blog/rss.xml');
  });

  it('returns empty array on network error', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockRejectedValue(new Error('Network error')),
    };
    Parser.mockImplementation(() => mockParser);

    const articles = await fetchLatestArticles('devto', 'nonexistent');

    expect(articles).toEqual([]);
  });

  it('defaults title to "Untitled" when item has no title', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({
        items: [makeMockItem({ title: undefined })],
      }),
    };
    Parser.mockImplementation(() => mockParser);

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles[0].title).toBe('Untitled');
  });

  it('defaults link to empty string when item has no link', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({
        items: [makeMockItem({ link: undefined })],
      }),
    };
    Parser.mockImplementation(() => mockParser);

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles[0].link).toBe('');
  });

  it('defaults pubDate to empty string when item has no pubDate', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({
        items: [makeMockItem({ pubDate: undefined })],
      }),
    };
    Parser.mockImplementation(() => mockParser);

    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles[0].pubDate).toBe('');
  });

  it('formats pubDate using toLocaleDateString', async () => {
    const Parser = require('rss-parser').default;
    const mockParser = {
      parseURL: vi.fn().mockResolvedValue({
        items: [makeMockItem({ pubDate: '2024-06-15T12:00:00.000Z' })],
      }),
    };
    Parser.mockImplementation(() => mockParser);

    const articles = await fetchLatestArticles('devto', 'testuser');

    // Should be a non-empty formatted string
    expect(articles[0].pubDate).toBeTruthy();
    expect(typeof articles[0].pubDate).toBe('string');
  });
});
