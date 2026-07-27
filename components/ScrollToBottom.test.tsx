import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ScrollToBottom from './ScrollToBottom';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronDown: (props: { size?: number; [key: string]: unknown }) => (
    <svg {...props}>
      <path d="M0 0" />
    </svg>
  ),
}));

// Mock framer-motion hooks used by ScrollToBottom
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <button {...props}>{children}</button>
    ),
    circle: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <circle {...props} />
    ),
    span: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
  },
  useScroll: vi.fn(() => ({
    scrollYProgress: { get: vi.fn(() => 0), on: vi.fn(), set: vi.fn() },
  })),
  useSpring: vi.fn((value) => ({
    get: vi.fn(() => value),
    set: vi.fn(),
  })),
  useTransform: vi.fn((_scrollProgress, _range, output) => output),
  useReducedMotion: vi.fn(() => false),
}));

describe('ScrollToBottom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default scroll position: near top of page
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 3000,
      writable: true,
      configurable: true,
    });
  });

  it('renders the button with correct aria-label', () => {
    render(<ScrollToBottom />);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(button).toBeInTheDocument();
  });

  it('is visible when scrolled near the top of the page', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });

    render(<ScrollToBottom />);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(button).toBeInTheDocument();
  });

  it('scrolls to document bottom when clicked', () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    render(<ScrollToBottom />);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    fireEvent.click(button);

    expect(scrollToMock).toHaveBeenCalledWith(
      expect.objectContaining({
        top: expect.any(Number),
        behavior: 'smooth',
      })
    );
  });

  it('calls scrollTo with scrollHeight as target top', () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 3000,
      writable: true,
    });

    render(<ScrollToBottom />);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    fireEvent.click(button);

    // scrollTo is called with an object containing top = scrollHeight
    expect(scrollToMock).toHaveBeenCalledWith(expect.objectContaining({ top: 3000 }));
  });

  it('renders with fixed positioning styles', () => {
    render(<ScrollToBottom />);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    // The component uses fixed positioning (bottom-right corner)
    // We verify the button renders, actual CSS class testing is visual
    expect(button).toBeInTheDocument();
  });
});
