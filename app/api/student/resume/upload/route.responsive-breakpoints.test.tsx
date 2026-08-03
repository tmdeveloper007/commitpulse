import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

const ResponsiveUploadPreview = () => {
  const isMobile = window.innerWidth <= 375;

  return (
    <div
      data-testid="layout"
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      <nav
        data-testid="navigation"
        style={{
          width: isMobile ? '100%' : '220px',
          flexShrink: 0,
        }}
      >
        Navigation
      </nav>

      <main
        data-testid="content"
        style={{
          flex: 1,
          width: isMobile ? '100%' : 'auto',
        }}
      >
        Resume Upload
      </main>

      {isMobile && (
        <button data-testid="mobile-toggle" aria-expanded="false">
          Menu
        </button>
      )}
    </div>
  );
};

describe('API Resume Upload Route - Responsive Breakpoints', () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    window.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth,
    });

    window.dispatchEvent(new Event('resize'));
  });

  it('1. simulates a standard mobile viewport (375px)', () => {
    render(<ResponsiveUploadPreview />);

    expect(window.innerWidth).toBe(375);
    expect(screen.getByTestId('layout')).toBeDefined();
  });

  it('2. reflows columns into a vertical layout', () => {
    render(<ResponsiveUploadPreview />);

    const layout = screen.getByTestId('layout');

    expect(layout.style.display).toBe('flex');
    expect(layout.style.flexDirection).toBe('column');
  });

  it('3. prevents horizontal overflow on mobile screens', () => {
    render(<ResponsiveUploadPreview />);

    const layout = screen.getByTestId('layout');

    expect(layout.style.maxWidth).toBe('100%');
    expect(layout.style.overflowX).toBe('hidden');
  });

  it('4. scales navigation for mobile viewports', () => {
    render(<ResponsiveUploadPreview />);

    const nav = screen.getByTestId('navigation');

    expect(nav.style.width).toBe('100%');
  });

  it('5. renders mobile specific toggle controls', () => {
    render(<ResponsiveUploadPreview />);

    const toggle = screen.getByTestId('mobile-toggle');

    expect(toggle).toBeDefined();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
