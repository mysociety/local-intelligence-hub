import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'IBMPlexSans': ['"IBM Plex Sans Condensed", sans-serif'], 
        'PPRightGrotesk': ['PPRightGrotesk, sans-serif'], 
      },
      fontSize: {
        hLg: ['36px', {
          lineHeight: '47px',
          letterSpacing: '0em',
          fontWeight: '700',
        }],
        hMd: ['21px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        hSm: ['16px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        base: ['16px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '400',
        }],
        sm: ['14px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '400',
        }],
        tiny: ['12px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '400',
        }],
        labelMain: ['12px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        labelLg: ['14px', {
          lineHeight: 'normal',
          letterSpacing: '0em',
          fontWeight: '500',
        }],
        dataName: ['13px', {
          lineHeight: '100%',
          letterSpacing: '0.65px',
          fontWeight: '500',
        }],
        dataResult: ['16px', {
          lineHeight: '100%',
          letterSpacing: '-0.32px',
          fontWeight: '400',
        }],
      },
      colors: {
        brand: "hsl(var(--brand))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        meepGray: {
          500: "hsl(var(--meep-gray-500))",
        },
        background: {
          DEFAULT: "hsl(var(--background))",
          secondary: "hsl(var(--background-secondary))",
          tertiary: "hsl(var(--background-tertiary))",
        },
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      
        white: {
          DEFAULT: "hsl(var(--white))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          text: "hsl(var(--muted-text))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
    
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/forms'),],
} satisfies Config

export default config