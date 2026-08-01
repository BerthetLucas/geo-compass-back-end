import type { TailwindConfig } from 'react-email';
import plugin from 'tailwindcss/plugin';

const colors = {
  // Light theme (default)
  bg: '#F7FAF9',
  'bg-2': '#FCFCFC',
  fg: '#1A1A1A',
  'fg-2': '#787878',
  'fg-3': '#9CA3A0',
  'fg-inverted': '#FFFFFF',
  stroke: '#E1E6E3',
  'stroke-strong': '#CFD6D2',
  brand: '#16A34A',
  // Dark theme (applied via the `dark:` variant, driven by prefers-color-scheme)
  'bg-dark': '#141417',
  'bg-2-dark': '#0A0A0C',
  'fg-dark': '#FAFAFA',
  'fg-2-dark': '#A1A1AA',
  'fg-3-dark': '#71717A',
  'fg-inverted-dark': '#082013',
  'stroke-dark': '#1F1F23',
  'stroke-strong-dark': '#2A2A30',
  'brand-dark': '#22C55E',
} as const;

const fontScale = {
  11: {
    fontSize: '11px',
    fontWeight: '420',
    letterSpacing: '-0.033px',
    lineHeight: '1.5',
  },
  13: {
    fontSize: '13px',
    fontWeight: '420',
    letterSpacing: '-0.039px',
    lineHeight: '1.5',
  },
  14: { fontSize: '14px', fontWeight: '450', lineHeight: '1.5' },
  16: {
    fontSize: '16px',
    fontWeight: '420',
    letterSpacing: '-0.048px',
    lineHeight: '1.5',
  },
  24: {
    fontSize: '24px',
    fontWeight: '600',
    letterSpacing: '-0.084px',
    lineHeight: '1',
  },
  28: {
    fontSize: '28px',
    fontWeight: '600',
    letterSpacing: '-0.084px',
    lineHeight: '1.3',
  },
  32: {
    fontSize: '32px',
    fontWeight: '600',
    letterSpacing: '-0.64px',
    lineHeight: '1.25',
  },
  40: {
    fontSize: '40px',
    fontWeight: '600',
    letterSpacing: '-0.8px',
    lineHeight: '1.1',
  },
} as const;

export const barebonesBoxedTailwindConfig: TailwindConfig = {
  darkMode: 'media',
  plugins: [
    plugin((api) => {
      api.addVariant('mobile', '@media (max-width: 600px)');
      const utilities: Record<string, Record<string, string>> = {};
      for (const [step, token] of Object.entries(fontScale)) {
        utilities[`.font-${step}`] = token;
      }
      api.addUtilities(utilities);
    }),
  ],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Arial', 'sans-serif'],
      },
    },
  },
};
