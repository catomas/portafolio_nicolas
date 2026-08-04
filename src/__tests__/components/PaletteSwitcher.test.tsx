import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaletteProvider } from '../../context/PaletteContext';
import PaletteSwitcher from '../../components/PaletteSwitcher';

function renderSwitcher() {
  return render(
    <PaletteProvider>
      <PaletteSwitcher />
    </PaletteProvider>,
  );
}

describe('PaletteSwitcher', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the palette panel when toggle button is clicked', () => {
    renderSwitcher();

    // Panel should not be visible initially
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

    // Click the toggle button
    fireEvent.click(screen.getByLabelText('Cambiar paleta de colores'));

    // Panel should now be visible
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('closes the palette panel when toggle button is clicked again', () => {
    renderSwitcher();

    const toggle = screen.getByLabelText('Cambiar paleta de colores');

    // Open
    fireEvent.click(toggle);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();

    // Close
    fireEvent.click(toggle);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('changes active palette when a swatch is clicked', () => {
    renderSwitcher();

    // Open panel
    fireEvent.click(screen.getByLabelText('Cambiar paleta de colores'));

    // Default is dark-classic, click on "Warm Cream"
    const warmCreamSwatch = screen.getByRole('radio', { name: 'Warm Cream' });
    fireEvent.click(warmCreamSwatch);

    // After click, Warm Cream should be active
    expect(warmCreamSwatch).toHaveAttribute('aria-checked', 'true');

    // Dark Classic should no longer be active
    const darkClassicSwatch = screen.getByRole('radio', { name: 'Dark Classic' });
    expect(darkClassicSwatch).toHaveAttribute('aria-checked', 'false');
  });

  it('active swatch has aria-checked="true"', () => {
    renderSwitcher();

    // Open panel
    fireEvent.click(screen.getByLabelText('Cambiar paleta de colores'));

    // Default palette is dark-classic
    const darkClassicSwatch = screen.getByRole('radio', { name: 'Dark Classic' });
    expect(darkClassicSwatch).toHaveAttribute('aria-checked', 'true');

    // Other swatches should have aria-checked="false"
    const warmCreamSwatch = screen.getByRole('radio', { name: 'Warm Cream' });
    expect(warmCreamSwatch).toHaveAttribute('aria-checked', 'false');
  });
});
