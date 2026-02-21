/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.html', './public/assets/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['LINE Seed JP', 'Hiragino Kaku Gothic ProN', 'Meiryo', 'sans-serif']
      },
      colors: {
        ink: '#0f172a',
        paper: '#f8fafc',
        mist: '#e2e8f0',
        brand: '#0f766e',
        accent: '#1d4ed8'
      }
    }
  },
  plugins: [require('@tailwindcss/line-clamp')]
};
