import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaletteProvider, usePaletteContext } from '../../context/PaletteContext';

/** Componente helper que expone el activePaletteId para los tests */
function PaletteConsumer() {
  const { activePaletteId } = usePaletteContext();
  return <span data-testid="palette-id">{activePaletteId}</span>;
}

describe('PaletteContext initialization logic', () => {
  beforeEach(() => {
    // Limpiar inline styles del documentElement entre tests
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default palette id when localStorage is empty', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    render(
      <PaletteProvider>
        <PaletteConsumer />
      </PaletteProvider>,
    );

    expect(screen.getByTestId('palette-id').textContent).toBe('dark-classic');
  });

  it('returns saved palette id when localStorage has a valid id', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('warm-cream');

    render(
      <PaletteProvider>
        <PaletteConsumer />
      </PaletteProvider>,
    );

    expect(screen.getByTestId('palette-id').textContent).toBe('warm-cream');
  });

  it('returns default palette id when localStorage has an invalid id', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('nonexistent');

    render(
      <PaletteProvider>
        <PaletteConsumer />
      </PaletteProvider>,
    );

    expect(screen.getByTestId('palette-id').textContent).toBe('dark-classic');
  });
});
