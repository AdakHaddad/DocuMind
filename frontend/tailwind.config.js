/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'documind-primary': 'var(--color-documind-primary)',
        'documind-secondary': 'var(--color-documind-secondary)',
        'documind-bg': 'var(--color-documind-bg)',
        'documind-card-bg': 'var(--color-documind-card-bg)',
        'documind-text-primary': 'var(--color-documind-text-primary)',
        'documind-text-secondary': 'var(--color-documind-text-secondary)',
        'documind-success': 'var(--color-documind-success)',
        'documind-error': 'var(--color-documind-error)',
      },
      fontFamily: {
        'inter': ['var(--font-inter)'],
        'open-sans': ['var(--font-open-sans)'],
      },
    },
  },
  plugins: [],
} 