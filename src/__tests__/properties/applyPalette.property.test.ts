import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { PALETTES } from '../../data/palettes';
import { applyPalette } from '../../context/PaletteContext';

/**
 * Property-based test: para cualquier paleta del registry,
 * applyPalette setea exactamente las 4 CSS properties esperadas con los valores correctos.
 *
 * **Validates: Requirements 3.1**
 */
describe('applyPalette property-based test', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
  });

  it('sets exactly the 4 expected CSS custom properties with correct values for any palette', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PALETTES), (palette) => {
        // Reset styles before each iteration
        document.documentElement.style.cssText = '';

        applyPalette(palette);

        const root = document.documentElement;

        expect(root.style.getPropertyValue('--color-bg-primary')).toBe(
          palette.colors.bgPrimary,
        );
        expect(root.style.getPropertyValue('--color-bg-secondary')).toBe(
          palette.colors.bgSecondary,
        );
        expect(root.style.getPropertyValue('--color-text-primary')).toBe(
          palette.colors.textPrimary,
        );
        expect(root.style.getPropertyValue('--color-accent')).toBe(
          palette.colors.accent,
        );
      }),
      { numRuns: 100 },
    );
  });
});
