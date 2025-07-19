import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1.5rem',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        cube: 'hsl(var(--cube))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
        },
        dropzone: {
          DEFAULT: 'hsl(var(--dropzone))',
        },
        badge: {
          DEFAULT: 'hsl(var(--badge))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        embossed: 'hsl(var(--embossed))',
        submerged: 'hsl(var(--submerged))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        serif: 'var(--font-battlefin)',
        sans: 'var(--font-nb-international)',
      },
      fontSize: {
        // Mobile first approach
        xs: ['10px', { lineHeight: '12px' }],
        sm: ['12px', { lineHeight: '14px' }],
        base: ['14px', { lineHeight: '16px' }],
        lg: ['16px', { lineHeight: '18px' }],
        xl: ['18px', { lineHeight: '20px' }],
        '2xl': ['20px', { lineHeight: '22px' }],
        '3xl': ['24px', { lineHeight: '26px' }],
        '4xl': ['28px', { lineHeight: '30px' }],
        '5xl': ['32px', { lineHeight: '34px' }],
        '6xl': ['36px', { lineHeight: '38px' }],
        '7xl': ['40px', { lineHeight: '42px' }],
        '8xl': ['44px', { lineHeight: '46px' }],
        '9xl': ['48px', { lineHeight: '50px' }],
        '10xl': ['52px', { lineHeight: '54px' }],
        '11xl': ['56px', { lineHeight: '58px' }],
        '12xl': ['60px', { lineHeight: '62px' }],
        '13xl': ['64px', { lineHeight: '66px' }],
        '14xl': ['68px', { lineHeight: '70px' }],
        '15xl': ['72px', { lineHeight: '74px' }],

        // Desktop & Tablet (md)
        'md:xs': ['12px', { lineHeight: '14px' }],
        'md:sm': ['14px', { lineHeight: '16px' }],
        'md:base': ['16px', { lineHeight: '18px' }],
        'md:lg': ['18px', { lineHeight: '20px' }],
        'md:xl': ['20px', { lineHeight: '22px' }],
        'md:2xl': ['24px', { lineHeight: '26px' }],
        'md:3xl': ['28px', { lineHeight: '30px' }],
        'md:4xl': ['32px', { lineHeight: '34px' }],
        'md:5xl': ['36px', { lineHeight: '38px' }],
        'md:6xl': ['40px', { lineHeight: '42px' }],
        'md:7xl': ['44px', { lineHeight: '46px' }],
        'md:8xl': ['48px', { lineHeight: '50px' }],
        'md:9xl': ['52px', { lineHeight: '54px' }],
        'md:10xl': ['56px', { lineHeight: '58px' }],
        'md:11xl': ['60px', { lineHeight: '62px' }],
        'md:12xl': ['64px', { lineHeight: '66px' }],
        'md:13xl': ['68px', { lineHeight: '70px' }],
        'md:14xl': ['72px', { lineHeight: '74px' }],
        'md:15xl': ['76px', { lineHeight: '78px' }],
      },
      animation: {
        shine: 'shine var(--duration, 2s) infinite linear',
        'expand-down': 'expandDown 0.3s ease-out',
        'collapse-up': 'collapseUp 0.3s ease-out',
        'chevron-rotate-up': 'chevronRotateUp 0.2s ease-out forwards',
        'chevron-rotate-down': 'chevronRotateDown 0.2s ease-out forwards',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
        expandDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
            maxHeight: '0',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
            maxHeight: '500px',
          },
        },
        collapseUp: {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)',
            maxHeight: '500px',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-10px)',
            maxHeight: '0',
          },
        },
        chevronRotateUp: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(180deg)' },
        },
        chevronRotateDown: {
          '0%': { transform: 'rotate(180deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [animate],
};
export default config;
