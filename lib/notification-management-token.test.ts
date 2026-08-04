import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createNotificationManagementToken,
  hashNotificationManagementToken,
  getNotificationManagementToken,
  verifyNotificationManagementToken,
} from './notification-management-token';

describe('notification-management-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotificationManagementToken', () => {
    it('produces a token starting with the cpn_ prefix', () => {
      const token = createNotificationManagementToken();
      expect(token.startsWith('cpn_')).toBe(true);
    });

    it('produces a token with base64url-encoded content after the prefix', () => {
      const token = createNotificationManagementToken();
      const afterPrefix = token.slice(4); // Remove 'cpn_'
      // Should be valid base64url
      expect(() => Buffer.from(afterPrefix, 'base64')).not.toThrow();
    });

    it('produces tokens of consistent format', () => {
      const token1 = createNotificationManagementToken();
      const token2 = createNotificationManagementToken();

      expect(token1.startsWith('cpn_')).toBe(true);
      expect(token2.startsWith('cpn_')).toBe(true);
    });
  });

  describe('hashNotificationManagementToken', () => {
    it('produces a 64-character hex string (SHA-256)', () => {
      const hash = hashNotificationManagementToken('test-token');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/i);
    });

    it('produces consistent hashes for the same input', () => {
      const hash1 = hashNotificationManagementToken('my-token');
      const hash2 = hashNotificationManagementToken('my-token');
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', () => {
      const hash1 = hashNotificationManagementToken('token-a');
      const hash2 = hashNotificationManagementToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getNotificationManagementToken', () => {
    it('returns header token when x-notification-token header is present', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-notification-token': 'header-token-value' },
      });

      const result = getNotificationManagementToken(request);
      expect(result).toBe('header-token-value');
    });

    it('returns trimmed header token', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-notification-token': '  header-token  ' },
      });

      const result = getNotificationManagementToken(request);
      expect(result).toBe('header-token');
    });

    it('falls back to body token when header is absent', () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ managementToken: 'body-token' }),
      });

      const result = getNotificationManagementToken(request, {
        managementToken: 'body-token',
      });
      expect(result).toBe('body-token');
    });

    it('returns null when neither header nor body token is present', () => {
      const request = new Request('https://example.com');

      const result = getNotificationManagementToken(request);
      expect(result).toBeNull();
    });

    it('returns header token even when body token is also present', () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-notification-token': 'from-header',
        },
        body: JSON.stringify({ managementToken: 'from-body' }),
      });

      const result = getNotificationManagementToken(request, {
        managementToken: 'from-body',
      });
      expect(result).toBe('from-header');
    });

    it('ignores non-string body token', () => {
      const request = new Request('https://example.com');

      const result = getNotificationManagementToken(request, {
        managementToken: 12345,
      });
      expect(result).toBeNull();
    });

    it('ignores whitespace-only body token', () => {
      const request = new Request('https://example.com');

      const result = getNotificationManagementToken(request, {
        managementToken: '   ',
      });
      expect(result).toBeNull();
    });
  });

  describe('verifyNotificationManagementToken', () => {
    it('returns true when provided token matches stored hash', () => {
      const token = createNotificationManagementToken();
      const hash = hashNotificationManagementToken(token);

      const result = verifyNotificationManagementToken(token, hash);
      expect(result).toBe(true);
    });

    it('returns false when provided token does not match stored hash', () => {
      const token1 = createNotificationManagementToken();
      const hash = hashNotificationManagementToken(token1);
      const token2 = createNotificationManagementToken(); // Different token

      const result = verifyNotificationManagementToken(token2, hash);
      expect(result).toBe(false);
    });

    it('returns false when providedToken is null', () => {
      const hash = hashNotificationManagementToken('any-token');

      const result = verifyNotificationManagementToken(null, hash);
      expect(result).toBe(false);
    });

    it('returns false when providedToken is empty string', () => {
      const hash = hashNotificationManagementToken('any-token');

      const result = verifyNotificationManagementToken('', hash);
      expect(result).toBe(false);
    });

    it('returns false when storedHash is null', () => {
      const token = createNotificationManagementToken();

      const result = verifyNotificationManagementToken(token, null);
      expect(result).toBe(false);
    });

    it('returns false when storedHash is undefined', () => {
      const token = createNotificationManagementToken();

      const result = verifyNotificationManagementToken(token, undefined);
      expect(result).toBe(false);
    });

    it('returns false when storedHash is not a valid 64-char hex string', () => {
      const token = createNotificationManagementToken();

      expect(verifyNotificationManagementToken(token, 'not-64-chars')).toBe(false);
      expect(verifyNotificationManagementToken(token, 'g'.repeat(63))).toBe(false);
      expect(verifyNotificationManagementToken(token, 'g'.repeat(65))).toBe(false);
      expect(verifyNotificationManagementToken(token, 'invalid@chars!')).toBe(false);
    });

    it('returns true for valid 64-char hex storedHash', () => {
      const token = createNotificationManagementToken();
      // SHA-256 hash is always 64 hex chars
      const hash = hashNotificationManagementToken(token);
      expect(hash).toHaveLength(64);

      const result = verifyNotificationManagementToken(token, hash);
      expect(result).toBe(true);
    });
  });
});
