import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ExportButton from './ExportButton';
import { useExportImage } from '@/hooks/useExportImage';

vi.mock('@/hooks/useExportImage', () => ({
  useExportImage: vi.fn(),
}));

const mockedUseExportImage = vi.mocked(useExportImage);

function setupExportButton(props?: { error?: string | null }) {
  const exportImage = vi.fn().mockResolvedValue(undefined);
  mockedUseExportImage.mockReturnValue({
    exportImage,
    isExporting: false,
    error: props?.error ?? null,
  });
  return { exportImage };
}

describe('ExportButton accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('trigger button has aria-haspopup="true"', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
  });

  it('trigger button aria-expanded is false when dropdown is closed', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('trigger button aria-expanded is true when dropdown is open', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('dropdown has role="menu"', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.click(trigger);

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  it('each format option has role="menuitem"', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.click(trigger);

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThanOrEqual(3);
  });

  it('error message has role="alert"', () => {
    setupExportButton({ error: 'Export failed: network error' });
    render(<ExportButton />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Export failed: network error');
  });

  it('trigger button is focusable', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toBeFocusable();
  });

  it('trigger button is keyboard activatable via Enter key', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('trigger button is keyboard activatable via Space key', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.keyDown(trigger, { key: ' ' });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('export button is disabled while isExporting is true', () => {
    mockedUseExportImage.mockReturnValue({
      exportImage: vi.fn(),
      isExporting: true,
      error: null,
    });
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-disabled', 'false'); // aria-disabled not set
  });

  it('PNG menuitem is labeled "Download PNG"', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.click(trigger);

    const pngItem = screen.getByRole('menuitem', { name: /download png/i });
    expect(pngItem).toBeInTheDocument();
  });

  it('PDF menuitem is labeled "Download PDF"', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.click(trigger);

    const pdfItem = screen.getByRole('menuitem', { name: /download pdf/i });
    expect(pdfItem).toBeInTheDocument();
  });

  it('SVG menuitem is labeled "Download SVG"', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.click(trigger);

    const svgItem = screen.getByRole('menuitem', { name: /download svg/i });
    expect(svgItem).toBeInTheDocument();
  });

  it('closes dropdown when Escape is pressed', () => {
    setupExportButton();
    render(<ExportButton />);

    const trigger = screen.getByRole('button', { name: /export/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
