/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mystic: {
          bg: '#0c0517',
          card: '#160b29',
          cardHover: '#21123d',
          gold: '#f59e0b',
          violet: '#8b5cf6',
          violetDark: '#7c3aed',
          rose: '#f43f5e',
          text: '#f3f4f6',
        }
      },
      boxShadow: {
        mysticGlow: '0 0 15px rgba(139,92,246,0.35)',
        goldGlow: '0 0 15px rgba(245,158,11,0.35)',
      }
    },
  },
  plugins: [],
}
