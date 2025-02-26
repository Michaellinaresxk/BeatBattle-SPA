// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'music-primary': '#6A0DAD',
        'music-secondary': '#FF3E71',
        'music-accent': '#00D1FF',
        'music-dark': '#190933',
        'music-light': '#E9D8FD',
        'music-success': '#00CC99',
        'music-warning': '#FFD600',
        'music-error': '#FF5252',
        'neon-pink': '#FF00FF',
        'cyber-blue': '#4DEEEA',
        'electric-violet': '#7700FF',
      },
      backgroundImage: {
        'music-gradient': 'linear-gradient(45deg, #6A0DAD, #FF3E71)',
        'neon-gradient': 'linear-gradient(90deg, #4DEEEA, #FF00FF)',
        'holographic': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%)',
        'futuristic': 'radial-gradient(circle at top right, rgba(74,0,224,0.8), rgba(142,0,158,0.8))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 209, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 209, 255, 0.8), 0 0 30px rgba(0, 209, 255, 0.6)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(0.5)' },
        }
      },
      boxShadow: {
        'neon': '0 0 5px rgba(0, 209, 255, 0.5), 0 0 20px rgba(0, 209, 255, 0.3)',
        'neon-pink': '0 0 5px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
        'neon-purple': '0 0 5px rgba(106, 13, 173, 0.5), 0 0 20px rgba(106, 13, 173, 0.3)',
      },
      dropShadow: {
        'neon': '0 0 8px rgba(0, 209, 255, 0.8)',
        'neon-text': '0 0 2px rgba(255, 255, 255, 0.8)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};