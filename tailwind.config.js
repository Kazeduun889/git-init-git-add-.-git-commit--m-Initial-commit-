/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255, 255, 255, 0.05)',
        accent: '#8B5CF6',
      },
      backgroundImage: {
        'main-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      }
    },
  },
  plugins: [],
}