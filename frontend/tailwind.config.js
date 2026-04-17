/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: '#6366f1', // Indigo Electric
        accent: '#8b5cf6',  // Violet Purple
        space: {
          950: '#020205',   // Deep Space Black
          900: '#0a0a0f',   // Translucent Midnight
          800: '#1a1a2e',   // Deep Navy (Borders)
        },
        glass: {
          DEFAULT: 'rgba(10, 10, 15, 0.7)',
          border: 'rgba(99, 102, 241, 0.1)',
        },
        status: {
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.4)',
      }
    },
  },
  plugins: [],
};
