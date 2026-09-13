import fs from 'fs';
import path from 'path';

export interface ThemeVariables {
  [key: string]: string;
}

export interface ContrastResult {
  variable: string;
  bgColorName: string;
  fgColorHex: string;
  bgColorHex: string;
  ratio: number;
  passAA: boolean; // >= 4.5
  passAAA: boolean; // >= 7.0
}

/**
 * Parses Hex color code (#RGB or #RRGGBB or #RRGGBBAA) into RGB values [r, g, b, a].
 */
export function parseColorToRgba(colorStr: string): [number, number, number, number] | null {
  if (!colorStr) return null;
  const str = colorStr.trim();

  // Hex format #fff or #ffffff or #ffffff80
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b, 1];
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b, 1];
    } else if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return [r, g, b, a];
    }
  }

  // rgb(r, g, b) or rgba(r, g, b, a) format
  const rgbaMatch = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    return [r, g, b, a];
  }

  return null;
}

/**
 * Blends a semi-transparent foreground color over an opaque background color.
 */
export function blendColors(fg: [number, number, number, number], bg: [number, number, number, number]): [number, number, number] {
  const alpha = fg[3];
  const r = Math.round(fg[0] * alpha + bg[0] * (1 - alpha));
  const g = Math.round(fg[1] * alpha + bg[1] * (1 - alpha));
  const b = Math.round(fg[2] * alpha + bg[2] * (1 - alpha));
  return [r, g, b];
}

/**
 * Calculates WCAG relative luminance of an RGB color tuple.
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates Contrast Ratio between two RGB colors (WCAG 2.1 standard).
 */
export function getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const lum1 = getLuminance(color1[0], color1[1], color1[2]);
  const lum2 = getLuminance(color2[0], color2[1], color2[2]);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract CSS variables from raw CSS block text.
 */
export function extractCssVariables(cssText: string): { dark: ThemeVariables; light: ThemeVariables } {
  const darkVars: ThemeVariables = {};
  const lightVars: ThemeVariables = {};

  // Strip CSS comments
  const cleanCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

  const extractBlockVars = (selectorPattern: RegExp): ThemeVariables => {
    const vars: ThemeVariables = {};
    const match = cleanCss.match(selectorPattern);
    if (match) {
      const blockContent = match[1];
      const lines = blockContent.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        const varMatch = line.match(/^(--[\w-]+)\s*:\s*([^;]+);/);
        if (varMatch) {
          vars[varMatch[1].trim()] = varMatch[2].trim();
        }
      }
    }
    return vars;
  };

  const dark = extractBlockVars(/:root\s*\{([^}]+)\}/);
  const light = extractBlockVars(/\[data-theme=['"]light['"]\]\s*\{([^}]+)\}/);

  return { dark, light };
}

/**
 * Reads specified CSS files from project directory and parses theme variables.
 */
export function loadProjectThemeVariables(cssFilePaths: string[] = ['src/styles/glass-ios.css']): { dark: ThemeVariables; light: ThemeVariables } {
  let combinedDark: ThemeVariables = {};
  let combinedLight: ThemeVariables = {};

  for (const relPath of cssFilePaths) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { dark, light } = extractCssVariables(content);
      combinedDark = { ...combinedDark, ...dark };
      combinedLight = { ...combinedLight, ...light };
    }
  }

  return { dark: combinedDark, light: combinedLight };
}

/**
 * Checks contrast ratio of text variables against background variables in specified theme.
 */
export function checkThemeContrast(
  themeVars: ThemeVariables,
  textVar: string,
  bgVar: string,
  minRatio: number = 4.5
): ContrastResult | null {
  const fgVal = themeVars[textVar];
  const bgVal = themeVars[bgVar];

  if (!fgVal || !bgVal) return null;

  let fgRgba = parseColorToRgba(fgVal);
  let bgRgba = parseColorToRgba(bgVal);

  if (!fgRgba || !bgRgba) return null;

  // Base solid background assuming opacity blend if needed
  const baseBg: [number, number, number, number] = bgRgba[3] < 1 ? [0, 0, 0, 1] : bgRgba;
  const blendedBg = bgRgba[3] < 1 ? blendColors(bgRgba, [0, 0, 0, 1]) : ([bgRgba[0], bgRgba[1], bgRgba[2]] as [number, number, number]);
  const blendedFg = fgRgba[3] < 1 ? blendColors(fgRgba, [baseBg[0], baseBg[1], baseBg[2], 1]) : ([fgRgba[0], fgRgba[1], fgRgba[2]] as [number, number, number]);

  const ratio = getContrastRatio(blendedFg, blendedBg);

  return {
    variable: textVar,
    bgColorName: bgVar,
    fgColorHex: fgVal,
    bgColorHex: bgVal,
    ratio: parseFloat(ratio.toFixed(2)),
    passAA: ratio >= minRatio,
    passAAA: ratio >= 7.0,
  };
}
