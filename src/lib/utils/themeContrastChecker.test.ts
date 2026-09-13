import { describe, it, expect } from 'vitest';
import {
  parseColorToRgba,
  getContrastRatio,
  loadProjectThemeVariables,
  checkThemeContrast,
} from './themeContrastChecker';

describe('Theme & Contrast Checker Engine', () => {
  it('correctly parses hex and rgba color strings', () => {
    expect(parseColorToRgba('#ffffff')).toEqual([255, 255, 255, 1]);
    expect(parseColorToRgba('#000000')).toEqual([0, 0, 0, 1]);
    expect(parseColorToRgba('#fff')).toEqual([255, 255, 255, 1]);
    expect(parseColorToRgba('#000')).toEqual([0, 0, 0, 1]);
    expect(parseColorToRgba('rgb(0, 122, 255)')).toEqual([0, 122, 255, 1]);
    expect(parseColorToRgba('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0, 0.5]);
  });

  it('calculates WCAG contrast ratio accurately', () => {
    const white: [number, number, number] = [255, 255, 255];
    const black: [number, number, number] = [0, 0, 0];

    // WCAG contrast ratio between absolute white and black is 21:1
    const ratio = getContrastRatio(white, black);
    expect(ratio).toBeCloseTo(21.0, 1);
  });

  it('loads project CSS theme variables from glass-ios.css', () => {
    const { dark, light } = loadProjectThemeVariables(['src/styles/glass-ios.css']);

    expect(dark['--bg-color']).toBeDefined();
    expect(dark['--text-primary']).toBeDefined();
    expect(light['--bg-color']).toBeDefined();
    expect(light['--text-primary']).toBeDefined();
  });

  it('verifies theme variable parity between dark and light modes', () => {
    const { dark, light } = loadProjectThemeVariables(['src/styles/glass-ios.css']);
    const criticalVars = ['--bg-color', '--text-primary', '--text-secondary', '--text-tertiary', '--input-bg', '--input-text'];

    criticalVars.forEach((v) => {
      expect(dark[v]).toBeDefined();
      expect(light[v]).toBeDefined();
    });
  });

  it('ensures Dark Theme primary text meets WCAG AA contrast ratio (>= 4.5)', () => {
    const { dark } = loadProjectThemeVariables(['src/styles/glass-ios.css']);
    const result = checkThemeContrast(dark, '--text-primary', '--bg-color', 4.5);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.passAA).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('ensures Light Theme primary text meets WCAG AA contrast ratio (>= 4.5)', () => {
    const { dark, light } = loadProjectThemeVariables(['src/styles/glass-ios.css']);
    const fullLightVars = { ...dark, ...light };

    const result = checkThemeContrast(fullLightVars, '--text-primary', '--bg-color', 4.5);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.passAA).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('ensures Light Theme secondary text meets WCAG AA contrast ratio (>= 4.5)', () => {
    const { dark, light } = loadProjectThemeVariables(['src/styles/glass-ios.css']);
    const fullLightVars = { ...dark, ...light };

    const result = checkThemeContrast(fullLightVars, '--text-secondary', '--bg-color', 4.5);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.passAA).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
