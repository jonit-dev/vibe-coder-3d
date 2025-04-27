import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        unitydark: {
          primary: '#4A90E2', // Unity blue
          'primary-content': '#ffffff',
          secondary: '#23272E', // Unity dark panel
          'secondary-content': '#A6ADBB',
          accent: '#2D2F34', // Slightly lighter for highlights
          'accent-content': '#ffffff',
          neutral: '#1B1C1F', // Main background
          'neutral-content': '#A6ADBB',
          'base-100': '#23272E', // Panel background
          'base-200': '#1B1C1F', // Main background
          'base-300': '#18191C', // Even darker
          'base-content': '#A6ADBB',
          info: '#4A90E2',
          success: '#27AE60',
          warning: '#F5A623',
          error: '#E74C3C',
        },
      },
      'dark',
      'cupcake',
    ],
    darkTheme: 'unitydark',
    base: true,
    styled: true,
    utils: true,
    logs: true,
  },
};
