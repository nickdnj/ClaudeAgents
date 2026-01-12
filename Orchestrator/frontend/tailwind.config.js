/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a5f7a',
          50: '#f0f7fa',
          100: '#e0eff4',
          200: '#b8dde8',
          300: '#7fc3d8',
          400: '#40a4c2',
          500: '#1a5f7a',
          600: '#165068',
          700: '#134156',
          800: '#103545',
          900: '#0d2a38',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
