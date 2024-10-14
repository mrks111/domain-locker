// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/app/pages/**/*.page.ts",
  ],
  theme: {
    extend: {
      keyframes: {
        fade: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-bounce': 'fade 1.5s infinite, bounce 1.5s infinite',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,  // Disable preflight if it causes too many issues
  },
}
