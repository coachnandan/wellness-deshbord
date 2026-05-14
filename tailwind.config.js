/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1F4D3A',
          hover: '#2F5D50',
          light: '#2D5A48',
        },
        sage: {
          DEFAULT: '#7A9B8E',
          light: '#A3BDB1',
        },
        gold: {
          DEFAULT: '#C2A878',
          light: '#D4C19C',
        },
        offwhite: {
          DEFAULT: '#F7F6F2',
          warm: '#FCFBF8',
        },
        charcoal: '#1E1E1E',
        muted: '#6B7280',
        beige: '#E7E5E4',
        emerald: '#3A7D5D',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'luxury': '0 8px 30px rgb(0,0,0,0.04)',
        'luxury-hover': '0 20px 50px rgba(31,77,58,0.08)',
      }
    },
  },
  plugins: [],
}
