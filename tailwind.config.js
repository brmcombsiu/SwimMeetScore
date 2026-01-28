/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './app.jsx'],
  theme: {
    extend: {
      fontFamily: {
        'outfit': ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        'pool': {
          'deep': '#0c1929',
          'mid': '#0f2942',
          'light': '#164e6e',
        },
        'chlorine': {
          DEFAULT: '#00d4aa',
          'glow': '#00ffcc',
          'dim': '#00a88a',
        },
        'lane': {
          'gold': '#fbbf24',
          'bright': '#fcd34d',
        },
        'foam': '#e0f7fa',
        'tile': '#38bdf8',
      }
    }
  },
  plugins: [],
}
