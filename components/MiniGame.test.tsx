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

vi.stubGlobal('AudioContext', MockAudioContext as unknown as typeof AudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext as unknown as typeof AudioContext);

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

  it('starts game and updates score display', () => {
    render(<MiniGame />);

    const initBtn = screen.getByRole('button', { name: /initialize/i });
    act(() => {
      fireEvent.click(initBtn);
    });

    // Game should be in playing state (no idle overlay)
    expect(screen.queryByText('SQUASH THE BUGS')).not.toBeInTheDocument();
    // Score should be displayed
    expect(screen.getByText(/SCORE:/)).toBeInTheDocument();
  });

  it('renders score and lives display when game is running', () => {
    render(<MiniGame />);

    const initBtn = screen.getByRole('button', { name: /initialize/i });
    act(() => {
      fireEvent.click(initBtn);
    });

    // Score display should be visible
    const scoreText = screen.getByText(/SCORE:/);
    expect(scoreText).toBeInTheDocument();
    expect(scoreText.textContent).toContain('0');

    // Lives should be shown (3 hearts separated by spaces)
    expect(screen.getByText(/♥ ♥ ♥/)).toBeInTheDocument();
  });
});
