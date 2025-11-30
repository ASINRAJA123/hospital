/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom theme colors are no longer needed
      // We will use the default Tailwind palette (e.g., bg-purple-600)
    },
  },
  plugins: [],
}