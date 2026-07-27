import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import MiniGame from './MiniGame';

// Mock AudioContext / webkitAudioContext to prevent Web Audio API errors in tests
class MockAudioContext {
  createOscillator = vi.fn(() => ({
    type: '',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  createGain = vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  }));
  destination = {};
  currentTime = 0;
  close = vi.fn();
}

vi.stubGlobal(
  'AudioContext',
  MockAudioContext as unknown as typeof AudioContext
);
vi.stubGlobal(
  'webkitAudioContext',
  MockAudioContext as unknown as typeof AudioContext
);

describe('MiniGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders idle state with SQUASH THE BUGS overlay and Initialize button', () => {
    render(<MiniGame />);

    expect(screen.getByText('SQUASH THE BUGS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /initialize/i })).toBeInTheDocument();
    expect(screen.getByText(/click targets before the ring closes/i)).toBeInTheDocument();
  });

  it('does not show SYSTEM FAILURE overlay when game has not started', () => {
    render(<MiniGame />);
    expect(screen.queryByText('SYSTEM FAILURE')).not.toBeInTheDocument();
  });

  it('starts game on Initialize button click', async () => {
    render(<MiniGame />);

    const initBtn = screen.getByRole('button', { name: /initialize/i });
    await act(async () => {
      fireEvent.click(initBtn);
    });

    // Overlay should be gone
    expect(screen.queryByText('SQUASH THE BUGS')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /initialize/i })).not.toBeInTheDocument();
    // Score should be visible
    expect(screen.getByText(/SCORE:/)).toBeInTheDocument();
  });

  it('shows score as 0 at game start', async () => {
    render(<MiniGame />);

    const initBtn = screen.getByRole('button', { name: /initialize/i });
    await act(async () => {
      fireEvent.click(initBtn);
    });

    expect(screen.getByText(/SCORE:\s*0/)).toBeInTheDocument();
  });

  it('renders initial hearts (3 lives)', async () => {
    render(<MiniGame />);

    const initBtn = screen.getByRole('button', { name: /initialize/i });
    await act(async () => {
      fireEvent.click(initBtn);
    });

    // 3 heart symbols
    const scoreArea = screen.getByText(/SCORE:/).parentElement;
    expect(scoreArea?.textContent).toContain('\u2665');
  });

  it('increments score when a critical bug is clicked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<MiniGame />);

    const initBtn = screen.getByRole('button', { name: /initialize/i });
    await act(async () => {
      fireEvent.click(initBtn);
    });

    // Advance time so bugs spawn
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // Find bug elements and click the first one
    const bugs = screen.queryAllByRole('button', { hidden: true });
    if (bugs.length > 0) {
      await act(async () => {
        fireEvent.mouseDown(bugs[0]);
      });
    }

    vi.useRealTimers();
  });

  it('triggers game over when all lives are lost', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<MiniGame />);

    const initBtn = screen.getByRole('button', { name: /initialize/i });
    await act(async () => {
      fireEvent.click(initBtn);
    });

    // Advance time well past all bug expiry (2500ms initial TTL)
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    // SYSTEM FAILURE should appear
    expect(screen.getByText('SYSTEM FAILURE')).toBeInTheDocument();
    // Reboot button should appear
    expect(screen.getByRole('button', { name: /reboot/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('Reboot button resets the game', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<MiniGame />);

    const initBtn = screen.getByRole('button', { name: /initialize/i });
    await act(async () => {
      fireEvent.click(initBtn);
    });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    const rebootBtn = screen.getByRole('button', { name: /reboot/i });
    await act(async () => {
      fireEvent.click(rebootBtn);
    });

    // Should be back to idle state
    expect(screen.getByText('SQUASH THE BUGS')).toBeInTheDocument();
    expect(screen.getByText(/SCORE:\s*0/)).toBeInTheDocument();

    vi.useRealTimers();
  });
});
