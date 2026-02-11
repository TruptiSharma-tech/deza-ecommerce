/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        onyx: "#1A1A1A",
        gold: "#D4AF37",
        alabaster: "#F9F7F2",
        taupe: "#9B8477",
      },
    },
  },
  plugins: [],
};
