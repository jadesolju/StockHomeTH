---
name: sustainable-tailwind-theme
description: Central design system rules and CSS-to-Tailwind semantic token mappings based on StockHomeTH Apple iOS glass design system (glass-ios.css). Use when creating or modifying UI components, styling, or theme configurations.
---

# ⚡ SKILL.MD (CORE) - Project Context & Rules

## 🤖 1. AI Persona & Scope
- **Role:** Expert Frontend Engineer & UI/UX Architect.
- **Tone:** Professional, direct, action-oriented peer.
- **Constraint:** All UI components must adhere strictly to Apple iOS minimalist standards and design layout tokens.

## 🛠️ 2. Tech Stack Tokens & Environment
- **Framework:** Next.js / React (Tailwind CSS).
- **Theme Strategy:** Dual-theme using `[data-theme='dark']` (default) and `[data-theme='light']`.
- **Primary Source:** `src/styles/glass-ios.css` (Contains all strict design tokens).

## 🚨 3. Immutable Execution Rules (กฎเหล็ก)
1. **[CRITICAL] CSS-to-Tailwind Mapping:** Every time a style, spacing, color, or component is mentioned or modified, the AI **must validate and map** the custom CSS token from `glass-ios.css` to the exact Tailwind / CSS variable equivalent.
2. **Contrast Alert:** Light mode must maintain WCAG AAA crisp typography (`--text-primary: #000000`, `--text-secondary: #1f2937`).
3. **No Arbitrary Hardcoding:** Do NOT output arbitrary hardcoded classes like `bg-[#0c0c0e]`, `text-black dark:text-white`, or `bg-white dark:bg-black`. Always refer back to semantic variable tokens (e.g., `glass-card`, `bg-[var(--bg-color)]`, `text-[var(--text-primary)]`).
4. **[EVENT TRIGGER] CSS/TS/TSX Detection:** Whenever writing or modifying `.css`, `.ts`, or `.tsx` files, the system **must automatically execute** a comprehensive Tailwind Mapping & Style consistency check against `src/styles/glass-ios.css`.
5. **Strict Code Cleanliness:** Flag any arbitrary classes found in `.tsx` files and replace them with corresponding system tokens instead.

---

## 🎨 4. StockHomeTH Semantic Design Tokens Mapping Table

| Category | CSS Variable Token | Dark Mode (Default) | Light Mode (WCAG AAA) | Tailwind / CSS Class | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Main Background** | `--bg-color` / `--bg-primary` | `#000000` | `#f2f2f7` | `bg-[var(--bg-color)]` | Full page container background |
| **Secondary Background** | `--bg-secondary` | `#0c0c0e` | `#ffffff` | `bg-[var(--bg-secondary)]` | Sidebar, panel, nested section |
| **Glass Surface** | `--glass-bg` | `rgba(28, 28, 30, 0.72)` | `#ffffff` | `glass-card` / `bg-[var(--glass-bg)]` | Main content card, modal surface |
| **Sub Card Surface** | `--card-sub-bg` | `rgba(255, 255, 255, 0.04)` | `#ffffff` | `bg-[var(--card-sub-bg)]` | Nested mini-card, metric box |
| **Primary Text** | `--text-primary` | `#ffffff` | `#000000` | `text-[var(--text-primary)]` | Headings, stock tickers, price |
| **Secondary Text** | `--text-secondary` | `#b0b0b6` | `#1f2937` | `text-[var(--text-secondary)]` | Subtitles, summaries, metadata |
| **Tertiary Text** | `--text-tertiary` | `#8e8e93` | `#4b5563` | `text-[var(--text-tertiary)]` | Timestamps, captions, disclaimers |
| **Glass Border** | `--glass-border` | `rgba(255, 255, 255, 0.09)` | `rgba(0, 0, 0, 0.09)` | `border-[var(--glass-border)]` | Card borders, modal outlines |
| **Subtle Border** | `--glass-border-subtle` | `rgba(255, 255, 255, 0.05)` | `rgba(0, 0, 0, 0.05)` | `border-[var(--glass-border-subtle)]` | Dividers, separators |
| **Brand Accent (Blue)** | `--accent-blue` | `#0a84ff` | `#007aff` | `text-[var(--accent-blue)]` / `bg-[var(--accent-blue)]` | Primary action buttons, links |
| **Brand Accent BG** | `--accent-blue-bg` | `rgba(10, 132, 255, 0.14)` | `rgba(0, 122, 255, 0.10)` | `bg-[var(--accent-blue-bg)]` | Category badges, highlights |
| **Bullish (Green)** | `--accent-bullish` | `#30d158` | `#15803d` | `text-[var(--accent-bullish)]` | Positive price change, buy signal |
| **Bullish BG** | `--accent-bullish-bg` | `rgba(48, 209, 88, 0.12)` | `rgba(21, 128, 61, 0.10)` | `bg-[var(--accent-bullish-bg)]` | Gain badges, positive alerts |
| **Bearish (Red)** | `--accent-bearish` | `#ff453a` | `#dc2626` | `text-[var(--accent-bearish)]` | Negative price change, sell alert |
| **Bearish BG** | `--accent-bearish-bg` | `rgba(255, 69, 58, 0.12)` | `rgba(220, 38, 38, 0.10)` | `bg-[var(--accent-bearish-bg)]` | Loss badges, risk warnings |
| **Neutral / Amber** | `--accent-neutral` | `#ff9f0a` | `#d97706` | `text-[var(--accent-neutral)]` | GemCoins, vouchers, notifications |
| **Input Background** | `--input-bg` | `rgba(255, 255, 255, 0.06)` | `#ffffff` | `bg-[var(--input-bg)]` | Form inputs, textareas, selects |
| **Input Border** | `--input-border` | `rgba(255, 255, 255, 0.14)` | `rgba(0, 0, 0, 0.16)` | `border-[var(--input-border)]` | Form control borders |

---

## 💎 5. Golden Examples (Bulletproof Components)

### Component: Stock Metric Card
```tsx
export function StockMetricCard({ ticker, name, price, changePercent, signal }: {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  signal: 'BUY' | 'SELL';
}) {
  const isBullish = changePercent >= 0;

  return (
    <div className="glass-card p-5 rounded-[var(--ios-radius)] border border-[var(--glass-border)] transition-all hover:border-[var(--accent-blue-border)]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[var(--text-primary)] text-lg font-bold tracking-tight">{ticker}</h3>
          <p className="text-[var(--text-secondary)] text-xs">{name}</p>
        </div>
        
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
          signal === 'BUY'
            ? 'bg-[var(--accent-bullish-bg)] text-[var(--accent-bullish)] border border-[var(--accent-bullish-border)]'
            : 'bg-[var(--accent-bearish-bg)] text-[var(--accent-bearish)] border border-[var(--accent-bearish-border)]'
        }`}>
          {signal === 'BUY' ? '🟢 สัญญาณบวก' : '🔴 ระวังแรงขาย'}
        </span>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--glass-border-subtle)] pt-3">
        <span className="text-[var(--text-primary)] text-2xl font-black">{price.toFixed(2)} ฿</span>
        <span className={`text-sm font-bold ${isBullish ? 'text-[var(--accent-bullish)]' : 'text-[var(--accent-bearish)]'}`}>
          {isBullish ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`}
        </span>
      </div>
    </div>
  );
}
```

---

## 🚫 6. Forbidden Anti-Patterns
1. ❌ `className="bg-white dark:bg-black"` (Never use dark: modifier)
2. ❌ `className="text-black dark:text-white"` (Use `text-[var(--text-primary)]`)
3. ❌ Hardcoded Hex values in JSX like `style={{ color: '#fef08a' }}` or `className="bg-[#121212]"`
4. ❌ Arbitrary Tailwind colors like `text-gray-400` or `bg-slate-800` that break in Light Mode
