/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false, // Preserve existing custom glass-ios and ai-chat styles
  },
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
  plugins: [],
};
