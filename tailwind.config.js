/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: ['assets/**', 'entrypoints/**', 'components/**'],
  theme: {
    extend: {
      fontFamily: {
        fira: ['Fira Code', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--color-background))',
        content: 'hsl(var(--color-content))',
        tertiary: 'hsl(var(--color-tertiary))',
        'selected-btn': 'hsl(var(--color-selected-btn))',
        'sub-heading': 'hsl(var(--color-sub-heading))',
        'btn-border': 'hsl(var(--color-btn-border))',
        'btn-bg': 'hsl(var(--color-btn-bg))',
      },
    },
  },
  plugins: [],
};
