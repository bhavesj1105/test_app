/** @type {import('tailwindcss').Config} */
module.exports = {
  // nativewind v2 ships its own babel plugin; using Tailwind without preset avoids requiring 'nativewind/tailwind'
  content: [
    './App.{js,jsx,ts,tsx}',
  './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
