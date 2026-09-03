/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#F7F8FA',
          100: '#EEF1F4',
          200: '#D7DDE3',
          300: '#B9C2CC',
          400: '#8793A0',
          500: '#65727F',
          600: '#4E5B67',
          700: '#374450',
          800: '#26323D',
          900: '#17212B',
        },
        candy: {
          500: '#2F6F9F',
          600: '#245A82',
        },
        leaf: {
          500: '#55B77A',
          600: '#3B9560',
        },
        sky: {
          500: '#2F6F9F',
        }
      },
      fontFamily: {
        display: ['"Poppins"', 'sans-serif'],
        body: ['"Montserrat"', 'sans-serif'],
      },
      borderRadius: {
        blob: '2rem 1rem 2rem 1rem',
      }
    },
  },
  plugins: [],
}
