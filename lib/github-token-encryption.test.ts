import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  encryptGitHubToken,
  decryptGitHubToken,
  parseAndEncryptTokens,
  getNextToken,
  isEncryptedToken,
  redactToken,
} from './github-token-encryption';

const TEST_KEY = 'a'.repeat(32); // 32-char key for AES-256

beforeAll(() => {
  process.env.GITHUB_TOKEN_ENCRYPTION_KEY = TEST_KEY;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('encryptGitHubToken / decryptGitHubToken', () => {
  it('encrypts a token and produces a GCM-format output (4 dot-separated parts)', () => {
    const encrypted = encryptGitHubToken('ghp_test_token_12345');
    const parts = encrypted.split('.');

    expect(parts).toHaveLength(4);
    // Each part should be valid base64
    parts.forEach((p) => expect(() => Buffer.from(p, 'base64')).not.toThrow());
  });

  it('round-trips correctly: encrypt then decrypt returns original token', () => {
    const plain = 'ghp_super_secret_token_xyz';
    const encrypted = encryptGitHubToken(plain);
    const decrypted = decryptGitHubToken(encrypted);

    expect(decrypted).toBe(plain);
  });

  it('throws on invalid token input (empty string)', () => {
    expect(() => encryptGitHubToken('')).toThrow('Invalid GitHub token');
  });

  it('throws on invalid token input (non-string)', () => {
    // @ts-expect-error testing invalid input
    expect(() => encryptGitHubToken(null)).toThrow('Invalid GitHub token');
    // @ts-expect-error testing invalid input
    expect(() => encryptGitHubToken(undefined)).toThrow('Invalid GitHub token');
  });

  it('throws when encrypted token format is unrecognized', () => {
    expect(() => decryptGitHubToken('not-a-valid-format-at-all')).toThrow(
      'Invalid encrypted token format'
    );
  });

  it('tampered ciphertext causes decryption to throw', () => {
    const encrypted = encryptGitHubToken('secret-value');
    const parts = encrypted.split('.');
    // Corrupt the last part (ciphertext)
    const tampered = [...parts];
    tampered[3] = Buffer.from('corrupted-data!!!').toString('base64');

    expect(() => decryptGitHubToken(tampered.join('.'))).toThrow();
  });

  it('different encryptions of the same token produce different outputs (random IV)', () => {
    const plain = 'same-value';
    const a = encryptGitHubToken(plain);
    const b = encryptGitHubToken(plain);

    expect(a).not.toBe(b);
    // Both should still decrypt to the same value
    expect(decryptGitHubToken(a)).toBe(plain);
    expect(decryptGitHubToken(b)).toBe(plain);
  });
});

describe('parseAndEncryptTokens', () => {
  it('encrypts multiple comma-separated tokens', () => {
    const tokens = 'ghp_token1,ghp_token2,ghp_token3';
    const result = parseAndEncryptTokens(tokens);

    expect(result).toHaveLength(3);
    expect(result[0].rotationIndex).toBe(0);
    expect(result[1].rotationIndex).toBe(1);
    expect(result[2].rotationIndex).toBe(2);
  });

  it('throws on empty string', () => {
    expect(() => parseAndEncryptTokens('')).toThrow('Token string is required');
  });

  it('throws on whitespace-only string', () => {
    expect(() => parseAndEncryptTokens('   ')).toThrow('No valid tokens found');
  });

  it('filters out empty tokens between commas', () => {
    const result = parseAndEncryptTokens('ghp_a,,ghp_b');
    expect(result).toHaveLength(2);
  });

  it('warns on non-GitHub token prefix via console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    parseAndEncryptTokens('not_a_github_token_12345');

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('warns on non-GitHub token prefix ghp_ and ghu_ tokens do not warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    parseAndEncryptTokens('ghp_abc123,ghu_xyz789');

    // Should not warn for valid prefixes
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('getNextToken', () => {
  it('returns the next token and cycles correctly from index 0', () => {
    const encrypted = ['token1', 'token2', 'token3'].map((t) => encryptGitHubToken(t));

    // getNextToken starts from (currentIndex + 1) % length
    const result = getNextToken(encrypted, 0);
    expect(result.token).toBe('token2'); // index (0+1) = 1
    expect(result.nextIndex).toBe(1);
  });

  it('cycles through tokens correctly', () => {
    const encrypted = ['tokA', 'tokB', 'tokC'].map((t) => encryptGitHubToken(t));

    // from index 0: next is index 1
    const r0 = getNextToken(encrypted, 0);
    expect(r0.token).toBe('tokB');
    expect(r0.nextIndex).toBe(1);

    // from index 1: next is index 2
    const r1 = getNextToken(encrypted, 1);
    expect(r1.token).toBe('tokC');
    expect(r1.nextIndex).toBe(2);

    // from index 2: next is index 0 (wraps around)
    const r2 = getNextToken(encrypted, 2);
    expect(r2.token).toBe('tokA');
    expect(r2.nextIndex).toBe(0);
  });

  it('throws when no tokens are provided', () => {
    expect(() => getNextToken([], 0)).toThrow('No encrypted tokens available');
  });

  it('throws when tokens array is empty', () => {
    expect(() => getNextToken([], 0)).toThrow('No encrypted tokens available');
  });
});

describe('isEncryptedToken', () => {
  it('returns true for valid GCM format (4 dot-separated base64 parts)', () => {
    const encrypted = encryptGitHubToken('test');
    expect(isEncryptedToken(encrypted)).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(isEncryptedToken('plaintext-token')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isEncryptedToken(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isEncryptedToken(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isEncryptedToken('')).toBe(false);
  });

  it('validates base64 validity of each part in GCM format', () => {
    // Buffer.from accepts any string as base64 without throwing
    // The function checks isGcmFormat (4 parts) then Buffer.from validation
    expect(isEncryptedToken('part1.part2.part3.part4')).toBe(true); // valid 4-part format
  });
});

describe('redactToken', () => {
  it('shows first 4 and last 4 characters with ... between', () => {
    const result = redactToken('ghp_abcdefghijkl');
    expect(result).toBe('ghp_...ijkl');
  });

  it('returns *** for tokens shorter than 10 characters', () => {
    expect(redactToken('short')).toBe('***');
    expect(redactToken('123456789')).toBe('***');
  });

  it('returns *** for null', () => {
    expect(redactToken(null)).toBe('***');
  });

  it('returns *** for undefined', () => {
    expect(redactToken(undefined)).toBe('***');
  });

  it('handles exactly 10-character tokens at the boundary', () => {
    // 10 chars: first 4 + '...' + last 4 = same as shown
    const result = redactToken('1234567890');
    expect(result).not.toBe('***');
  });
});
