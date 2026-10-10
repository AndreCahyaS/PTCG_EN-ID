/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pokemon: {
          red: '#dc2626',
          yellow: '#facc15',
          blue: '#2563eb',
          dark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
