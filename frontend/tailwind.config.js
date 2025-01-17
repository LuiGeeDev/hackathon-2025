/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    spacing: spacing(),
  },
  plugins: [require("@tailwindcss/typography")],
};

function spacing() {
  const spacing = {};
  for (let i = 0; i < 300; i++) {
    spacing[i] = `${i}px`;
  }
  return spacing;
}
