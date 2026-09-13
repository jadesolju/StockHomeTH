---
name: sustainable-tailwind-theme
description: Central design system rules, automated event triggers, and strict CSS-to-Tailwind semantic token mappings based on StockHomeTH Apple iOS glass design system (glass-ios.css).
---

# SKILL.MD - Project Context, Rules, and Design System Mapping

[SYSTEM DEFINITION]
This file serves as the single source of truth for AI context, coding standards, and strict system architecture rules. It enforces styling continuity and prevents technical drift across CSS, TS, and TSX files.

---

## 1. AI Persona and Execution Scope

- [ROLE] Expert Frontend Engineer and UI/UX Architect specializing in Apple iOS design language.
- [TONE] Professional, direct, technical, and objective peer. No fluff, no emoji usage, and pure technical accuracy.
- [CONTEXT PREFERENCE] Prioritize design system tokens over generic Tailwind structures.

---

## 2. Automated Event Triggers (Event-Driven Rules)

The system operates on an automated trigger mechanism based on file extensions. Whenever the user inputs code or queries related to these formats, execute the following protocols:

- [.CSS TRIGGER]
  - Scan for raw color hex codes, absolute pixel values, or unmapped animations.
  - Cross-reference styles with the token map of `src/styles/glass-ios.css`.
  - Enforce compliance by outputting exact CSS-to-Tailwind utility translations.

- [.TS / .TSX TRIGGER]
  - Intercept and audit inline styles or arbitrary Tailwind classes (e.g., `bg-[#0c0c0e]`).
  - Enforce component property definitions (Variants) to match specified theme attributes.
  - Require the use of `tailwind-merge` or `clsx` for any conditional class merging to avoid collision bugs.

---

## 3. Tailwind Configuration Map (tailwind.config.js)

Inject these exact design tokens inside the configuration file to bridge CSS Variables with utility selectors:

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        apple: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Prompt"', '"Inter"', 'sans-serif'],
      },
      colors: {
        apple: {
          bg: 'var(--bg-color)',
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          glass: 'var(--glass-bg)',
          'glass-hover': 'var(--glass-bg-hover)',
          'glass-active': 'var(--glass-bg-active)',
          'card-sub': 'var(--card-sub-bg)',
          input: 'var(--input-bg)',
          'footer-bg': 'var(--footer-bg)',
        },
        accent: {
          blue: { DEFAULT: 'var(--accent-blue)', hover: 'var(--accent-blue-hover)', bg: 'var(--accent-blue-bg)', border: 'var(--accent-blue-border)', glow: 'var(--accent-blue-glow)' },
          bullish: { DEFAULT: 'var(--accent-bullish)', bg: 'var(--accent-bullish-bg)', border: 'var(--accent-bullish-border)' },
          bearish: { DEFAULT: 'var(--accent-bearish)', bg: 'var(--accent-bearish-bg)', border: 'var(--accent-bearish-border)' },
          neutral: { DEFAULT: 'var(--accent-neutral)', bg: 'var(--accent-neutral-bg)', border: 'var(--accent-neutral-border)' },
        },
        text: {
          apple: { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', tertiary: 'var(--text-tertiary)', inverse: 'var(--text-inverse)', input: 'var(--input-text)' }
        }
      },
      borderColor: {
        apple: { glass: 'var(--glass-border)', 'glass-subtle': 'var(--glass-border-subtle)', 'glass-active': 'var(--glass-border-active)', 'card-sub': 'var(--card-sub-border)', card: 'var(--card-border)', input: 'var(--input-border)', 'footer-border': 'var(--footer-border)', 'footer-divider': 'var(--footer-divider)' }
      },
      borderRadius: { ios: 'var(--ios-radius)', 'ios-sm': 'var(--ios-radius-sm)', 'ios-lg': 'var(--ios-radius-lg)' },
      boxShadow: { glass: 'var(--glass-shadow)' }
    },
  },
}
```

---

## 4. Strict CSS-to-Tailwind Mapping Table

| UI Element | CSS Native Target | Tailwind Utility Equivalent |
| :--- | :--- | :--- |
| Body Base | `body { font-family: var(--font-family); ... }` | `font-apple bg-apple text-text-apple-primary min-h-screen overflow-x-hidden relative antialiased` |
| Glass Card | `.glass-card` | `bg-apple-glass backdrop-blur-[24px] saturate-[180%] border border-apple-glass rounded-ios shadow-glass transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden` |
| Card Hover | `.glass-card:hover` | `hover:bg-apple-glass-hover hover:border-white/16 data-[theme=light]:hover:border-black/15` |
| Segmented Control | `.ios-segmented-control` | `inline-flex bg-white/6 data-[theme=light]:bg-black/5 p-[3px] rounded-[12px] border border-apple-glass-subtle data-[theme=light]:border-black/6 backdrop-blur-[24px] relative` |
| Segment Button | `.ios-segment-btn` | `px-4 py-[7px] rounded-[9px] border-none bg-transparent text-text-apple-secondary font-apple text-[0.85rem] font-semibold cursor-pointer transition-all duration-180 ease flex items-center gap-[6px] z-10 hover:text-text-apple-primary` |
| Active Segment | `.ios-segment-btn.active` | `!text-white bg-[#2c2c2e] shadow-[0_1px_4px_rgba(0,0,0,0.3)] font-bold data-[theme=light]:!text-black data-[theme=light]:bg-white data-[theme=light]:shadow-[0_1px_4px_rgba(0,0,0,0.1)]` |
| Solid Dropdown | `.solid-dropdown` | `bg-apple-secondary border border-apple-card shadow-[0_16px_40px_rgba(0,0,0,0.4)] data-[theme=light]:bg-white data-[theme=light]:border-black/10 data-[theme=light]:shadow-[0_16px_40px_rgba(0,0,0,0.1)]` |
| Bullish Badge | `.badge-bullish` | `inline-flex items-center gap-1.25 px-2.25 py-0.75 rounded-md text-[0.75rem] font-semibold bg-accent-bullish-bg text-accent-bullish border border-accent-bullish-border` |
| Bearish Badge | `.badge-bearish` | `inline-flex items-center gap-1.25 px-2.25 py-0.75 rounded-md text-[0.75rem] font-semibold bg-accent-bearish-bg text-accent-bearish border border-accent-bearish-border` |
| Neutral Badge | `.badge-neutral` | `inline-flex items-center gap-1.25 px-2.25 py-0.75 rounded-md text-[0.75rem] font-semibold bg-accent-neutral-bg text-accent-neutral border border-accent-neutral-border` |
| Ticker Pill | `.ticker-pill` | `px-2 py-0.75 rounded-md bg-apple-card-sub border border-apple-card-sub font-apple text-[0.75rem] font-semibold text-text-apple-primary inline-flex items-center` |
| Takeaway List | `.takeaway-list` | `flex flex-col gap-2 mt-2.5` |
| Takeaway Item | `.takeaway-item` | `flex items-start gap-2.5 text-[0.875rem] text-text-apple-primary leading-normal` |
| Takeaway Bullet | `.takeaway-bullet` | `w-1.25 h-1.25 rounded-full bg-accent-blue mt-[7px] shrink-0` |
| Sheet Overlay | `.ios-sheet-overlay` | `fixed inset-0 bg-black/72 backdrop-blur-md z-[99999] flex items-center justify-center animate-[fadeIn_0.2s_ease]` |

---

## 5. Critical Architecture Guardrails

- [THEME COMPLIANCE]
  - Do NOT hardcode colors using hex keys inside components. Always map via semantic variant tokens to guarantee light and dark mode reliability (`data-[theme='light']`).
  - Light mode typography must strictly retain high-contrast values (`--text-primary: #000000`) for WCAG AAA adherence.

- [LAYOUT INTEGRITY]
  - Mobile layouts must leverage `--safe-area-top` and `--safe-area-bottom` via custom padding utilities to circumvent notch and home indicator masking on iOS devices.
  - Interactive elements must inject `-webkit-tap-highlight-color: transparent` to override generic mobile browser behaviors.

- [STATE HIERARCHY]
  - Interactive states must strictly declare classes sequentially: Base state -> Hover state (`hover:`) -> Active state (`active:`) -> Focus state (`focus:`).
