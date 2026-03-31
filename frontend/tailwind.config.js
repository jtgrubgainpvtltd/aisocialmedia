/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3EC',
        'cream-mid': '#EDEAE2',
        teal: '#007A64',
        'teal-dark': '#005a48',
        'near-black': '#0C0C0C',
      },
      fontFamily: {
        unbounded: ['Unbounded', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        inter: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        card: '0 2px 20px rgba(0,0,0,.06)',
        'card-hover': '0 8px 40px rgba(0,0,0,.10)',
      },
    },
  },
  plugins: [],
}
