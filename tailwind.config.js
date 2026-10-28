/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        safetube: {
          red: '#FF0033',
          crimson: '#D90429',
          dark: '#0F0F0F',
          darker: '#080808',
          card: '#181818',
          cardHover: '#222222',
          border: '#272727',
          lightBg: '#F9F9F9',
          lightCard: '#FFFFFF',
          lightBorder: '#E5E5E5'
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
