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
        // 'selected-btn': 'hsl(var(--color-selected-btn)',
      },
    },
  },
  plugins: [],
};
