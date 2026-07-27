import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

describe('KeyboardShortcutsModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow after each test
    document.body.style.overflow = '';
  });

  it('does not render when isOpen is false', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    // The backdrop is the first div inside the dialog with bg-black/50
    const backdropDiv = document.querySelector('[class*="absolute inset-0 bg-black"]');
    if (backdropDiv instanceof HTMLElement) {
      fireEvent.click(backdropDiv);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('closes on X button click', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    const closeBtn = screen.getByRole('button', { name: /close shortcuts modal/i });
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    expect(document.body.style.overflow).toBe('hidden');

    rerender(<KeyboardShortcutsModal isOpen={false} onClose={mockOnClose} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('renders Navigation shortcuts', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Go to Home')).toBeInTheDocument();
    expect(screen.getByText('Go to Contributors')).toBeInTheDocument();
    expect(screen.getByText('Go to Compare')).toBeInTheDocument();
    expect(screen.getByText('Go to Customization Studio')).toBeInTheDocument();
  });

  it('renders General shortcuts', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Open keyboard shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Close this modal')).toBeInTheDocument();
  });

  it('renders kbd elements for shortcut keys', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    const kbdElements = document.querySelectorAll('kbd');
    expect(kbdElements.length).toBeGreaterThan(0);
  });

  it('renders footer hint', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/press \? to toggle this modal/i)).toBeInTheDocument();
  });
});
