/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        hirivo: {
          teal:        '#0A5C6B',
          'teal-mid':  '#0E7A8C',
          'teal-light':'#E6F4F6',
          gold:        '#C8860A',
          'gold-dark': '#B07509',
          'gold-light':'#FEF6E7',
          ink:         '#0F1F27',
          text:        '#1E3340',
          muted:       '#506070',
          border:      '#D4DFE4',
          surface:     '#F5F8FA',
          green:       '#1B6E3A',
          'green-bg':  '#EAF5EE',
          amber:       '#B85C00',
          'amber-bg':  '#FFF3E0',
          red:         '#AE1C2D',
          'red-bg':    '#FDECEA',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}