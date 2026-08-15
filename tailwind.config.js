/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        recime: {
          navy: '#131D33',
          'navy-light': '#1C2B4B',
          'navy-dark': '#0C1322',
          mango: '#E36338',
          'mango-hover': '#CE542C',
          'mango-light': '#FFF1EC',
          parchment: '#FAF7F2',
          'parchment-subtle': '#F4EFE6',
          'parchment-border': '#E8E1D3',
          corn: '#F4B53F',
          'corn-light': '#FEF7E6',
          sage: '#4E7D63',
          'sage-light': '#EEF5F1',
          charcoal: '#1A1C1E',
          muted: '#68707C',
        }
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(19, 29, 51, 0.06)',
        'float': '0 20px 40px rgba(19, 29, 51, 0.12)',
        'glow': '0 0 25px rgba(227, 99, 56, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
