// Tailwind CSS configuration for Memory Companion Agent
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontSize: {
        'patient': '1.5rem',  // 24px minimum for patient chat screen
      }
    }
  },
  plugins: []
}
