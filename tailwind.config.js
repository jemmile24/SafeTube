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
          // True OLED Pitch Black
          dark: '#000000',
          darker: '#000000',
          card: '#0D0D0D',
          cardHover: '#171717',
          border: '#1E1E1E',
          // True Pure Crisp White
          lightBg: '#FFFFFF',
          lightCard: '#F7F7F8',
          lightBorder: '#E5E7EB'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
