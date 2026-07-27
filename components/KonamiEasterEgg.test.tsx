import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import KonamiEasterEgg from './KonamiEasterEgg';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function simulateKeySequence(keys: string[]) {
  keys.forEach((key) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    window.dispatchEvent(event);
  });
}

describe('KonamiEasterEgg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render overlay before secret code is entered', () => {
    render(<KonamiEasterEgg />);

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();
  });

  it('renders full overlay after entering secret code "commit"', async () => {
    render(<KonamiEasterEgg />);

    simulateKeySequence(['c', 'o', 'm', 'm', 'i', 't']);

    // After typing the secret code, the overlay should appear
    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });

  it('renders the git commit command line message', async () => {
    render(<KonamiEasterEgg />);

    simulateKeySequence(['c', 'o', 'm', 'm', 'i', 't']);

    expect(screen.getByText(/git commit -m "unlocked_easter_egg"/i)).toBeInTheDocument();
  });

  it('renders the version footer', async () => {
    render(<KonamiEasterEgg />);

    simulateKeySequence(['c', 'o', 'm', 'm', 'i', 't']);

    expect(screen.getByText(/commitpulse v\d/i)).toBeInTheDocument();
  });

  it('renders overlay even when charCount is 0 (matrix rain disabled)', async () => {
    render(<KonamiEasterEgg charCount={0} />);

    simulateKeySequence(['c', 'o', 'm', 'm', 'i', 't']);

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });

  it('renders overlay even when confettiCount is 0 (confetti disabled)', async () => {
    render(<KonamiEasterEgg confettiCount={0} />);

    simulateKeySequence(['c', 'o', 'm', 'm', 'i', 't']);

    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });

  it('accepts a custom secretCode prop', () => {
    render(<KonamiEasterEgg secretCode="test" />);

    // Wrong sequence for 'test' should not trigger
    simulateKeySequence(['c', 'o', 'm', 'm', 'i', 't']);
    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();

    // Correct sequence should trigger
    simulateKeySequence(['t', 'e', 's', 't']);
    expect(screen.getByText('You Found It!')).toBeInTheDocument();
  });

  it('ignores keypresses in input elements', () => {
    render(<KonamiEasterEgg />);

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    simulateKeySequence(['c', 'o', 'm', 'm', 'i', 't']);

    // Should not trigger because keys were pressed while in an input
    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();

    document.body.removeChild(input);
  });

  it('ignores keypresses in textarea elements', () => {
    render(<KonamiEasterEgg />);

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    simulateKeySequence(['c', 'o', 'm', 'm', 'i', 't']);

    expect(screen.queryByText('You Found It!')).not.toBeInTheDocument();

    document.body.removeChild(textarea);
  });

  it('registers keydown event listener on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<KonamiEasterEgg />);

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('removes keydown event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<KonamiEasterEgg />);

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
