import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			display: [
  				'Arial Black',
  				'Arial',
  				'sans-serif'
  			],
  			body: [
  				'Arial',
  				'sans-serif'
  			],
  			sans: [
  				'Poppins',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'Merriweather',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		},
  		fontSize: {
  			'xs-tight': [
  				'0.6875rem',
  				{
  					lineHeight: '1rem',
  					letterSpacing: '0.02em'
  				}
  			],
  			label: [
  				'0.75rem',
  				{
  					lineHeight: '1rem',
  					letterSpacing: '0.01em'
  				}
  			],
  			caption: [
  				'0.8125rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			'subtitle-sm': [
  				'0.9375rem',
  				{
  					lineHeight: '1.375rem'
  				}
  			],
  			subtitle: [
  				'1.0625rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			'subtitle-lg': [
  				'1.1875rem',
  				{
  					lineHeight: '1.625rem'
  				}
  			],
  			'headline-sm': [
  				'1.375rem',
  				{
  					lineHeight: '1.75rem',
  					letterSpacing: '-0.01em'
  				}
  			],
  			headline: [
  				'1.625rem',
  				{
  					lineHeight: '2rem',
  					letterSpacing: '-0.015em'
  				}
  			],
  			'headline-lg': [
  				'2rem',
  				{
  					lineHeight: '2.375rem',
  					letterSpacing: '-0.02em'
  				}
  			],
  			'display-sm': [
  				'2.5rem',
  				{
  					lineHeight: '2.75rem',
  					letterSpacing: '-0.025em'
  				}
  			],
  			display: [
  				'3rem',
  				{
  					lineHeight: '3.25rem',
  					letterSpacing: '-0.03em'
  				}
  			],
  			'display-lg': [
  				'3.75rem',
  				{
  					lineHeight: '4rem',
  					letterSpacing: '-0.03em'
  				}
  			]
  		},
  		fontWeight: {
  			medium: '500',
  			semibold: '600'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			kiki: {
  				red: 'hsl(var(--kiki-red))',
  				'red-warm': 'hsl(var(--kiki-red-warm))',
  				pink: 'hsl(var(--kiki-pink))',
  				'pink-bubble': 'hsl(var(--kiki-pink-bubble))',
  				'pink-soft': 'hsl(var(--kiki-pink-soft))',
  				black: 'hsl(var(--kiki-black))',
  				white: 'hsl(var(--kiki-white))',
  				grey: 'hsl(var(--kiki-grey))',
  				glow: 'hsl(var(--kiki-glow))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'pulse-soft': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.6'
  				}
  			},
  			'badge-ping': {
  				'0%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'50%': {
  					transform: 'scale(1.4)',
  					opacity: '0.7'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'badge-bounce': {
  				'0%, 100%': {
  					transform: 'scale(1)'
  				},
  				'25%': {
  					transform: 'scale(1.3)'
  				},
  				'50%': {
  					transform: 'scale(0.9)'
  				},
  				'75%': {
  					transform: 'scale(1.15)'
  				}
  			},
  			'float': {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-10px)'
  				}
  			},
  			'fade-up': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'glow': {
  				'0%, 100%': {
  					boxShadow: '0 0 20px hsl(var(--kiki-pink) / 0.3)'
  				},
  				'50%': {
  					boxShadow: '0 0 40px hsl(var(--kiki-pink) / 0.5)'
  				}
  			},
  			'gradient-shift': {
  				'0%': {
  					backgroundPosition: '0% 50%'
  				},
  				'50%': {
  					backgroundPosition: '100% 50%'
  				},
  				'100%': {
  					backgroundPosition: '0% 50%'
  				}
  			},
  			'shimmer': {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			'shimmer-badge': {
  				'0%': {
  					backgroundPosition: '200% 0'
  				},
  				'100%': {
  					backgroundPosition: '-200% 0'
  				}
  			},
  			'perfect-glow': {
  				'0%, 100%': {
  					boxShadow: '0 0 16px 6px hsl(var(--primary) / 0.5), 0 0 32px 12px hsl(var(--primary) / 0.25)',
  					transform: 'scale(1)'
  				},
  				'50%': {
  					boxShadow: '0 0 24px 10px hsl(var(--primary) / 0.7), 0 0 48px 20px hsl(var(--primary) / 0.35)',
  					transform: 'scale(1.05)'
  				}
  			},
  			'invisible-activate': {
  				'0%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				},
  				'25%': {
  					opacity: '0.5',
  					transform: 'scale(0.95)'
  				},
  				'50%': {
  					opacity: '0.3',
  					transform: 'scale(1.05)'
  				},
  				'75%': {
  					opacity: '0.6',
  					transform: 'scale(0.98)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			'invisible-glow': {
  				'0%, 100%': {
  					boxShadow: '0 0 0 0 hsl(45 93% 47% / 0)'
  				},
  				'50%': {
  					boxShadow: '0 0 20px 8px hsl(45 93% 47% / 0.4)'
  				}
  			},
  			'press': {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'50%': {
  					transform: 'scale(0.95)'
  				},
  				'100%': {
  					transform: 'scale(1)'
  				}
  			},
  			'tap': {
  				'0%, 100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'50%': {
  					transform: 'scale(0.97)',
  					opacity: '0.9'
  				}
  			},
  			'bounce-subtle': {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-3px)'
  				}
  			},
  			'bounce-tap': {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'30%': {
  					transform: 'scale(0.92)'
  				},
  				'50%': {
  					transform: 'scale(1.05)'
  				},
  				'70%': {
  					transform: 'scale(0.98)'
  				},
  				'100%': {
  					transform: 'scale(1)'
  				}
  			},
  			'bounce-press': {
  				'0%': {
  					transform: 'scale(1) translateY(0)'
  				},
  				'40%': {
  					transform: 'scale(0.95) translateY(2px)'
  				},
  				'60%': {
  					transform: 'scale(1.02) translateY(-3px)'
  				},
  				'80%': {
  					transform: 'scale(0.99) translateY(0)'
  				},
  				'100%': {
  					transform: 'scale(1) translateY(0)'
  				}
  			},
  			'pop': {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'50%': {
  					transform: 'scale(1.15)'
  				},
  				'100%': {
  					transform: 'scale(1)'
  				}
  			},
  			'wiggle': {
  				'0%, 100%': {
  					transform: 'rotate(0deg)'
  				},
  				'25%': {
  					transform: 'rotate(-2deg)'
  				},
  				'75%': {
  					transform: 'rotate(2deg)'
  				}
  			},
  			'shake': {
  				'0%, 100%': {
  					transform: 'translateX(0)'
  				},
  				'10%, 30%, 50%, 70%, 90%': {
  					transform: 'translateX(-4px)'
  				},
  				'20%, 40%, 60%, 80%': {
  					transform: 'translateX(4px)'
  				}
  			},
  			'ripple': {
  				'0%': {
  					transform: 'scale(0)',
  					opacity: '0.6'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '0'
  				}
  			},
  			'super-spark-pulse': {
  				'0%, 100%': {
  					filter: 'drop-shadow(0 0 0 transparent)',
  					transform: 'scale(1)'
  				},
  				'50%': {
  					filter: 'drop-shadow(0 0 8px hsl(270 70% 60%)) drop-shadow(0 0 12px hsl(220 80% 60%))',
  					transform: 'scale(1.1)'
  				}
  			},
  			'orbit': {
  				'0%': {
  					transform: 'rotate(0deg) translateX(16px) rotate(0deg)'
  				},
  				'100%': {
  					transform: 'rotate(360deg) translateX(16px) rotate(-360deg)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
  			'badge-ping': 'badge-ping 0.6s ease-out',
  			'badge-bounce': 'badge-bounce 0.5s ease-out',
  			'float': 'float 6s ease-in-out infinite',
  			'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
  			'stagger-fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
  			'glow': 'glow 2s ease-in-out infinite',
  			'gradient-shift': 'gradient-shift 4s ease infinite',
  			'shimmer': 'shimmer 2s linear infinite',
  			'shimmer-badge': 'shimmer-badge 3s ease-in-out infinite',
  			'perfect-glow': 'perfect-glow 2s ease-in-out infinite',
  			'invisible-activate': 'invisible-activate 0.6s ease-out',
  			'invisible-glow': 'invisible-glow 1.5s ease-out',
  			'press': 'press 0.15s ease-out',
  			'tap': 'tap 0.1s ease-out',
  			'bounce-subtle': 'bounce-subtle 0.3s ease-out',
  			'bounce-tap': 'bounce-tap 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'bounce-press': 'bounce-press 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'pop': 'pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'wiggle': 'wiggle 0.3s ease-in-out',
  			'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
  			'ripple': 'ripple 0.6s ease-out forwards',
  			'super-spark-pulse': 'super-spark-pulse 1.5s ease-in-out infinite',
  			'orbit': 'orbit 2s linear infinite'
  		},
  		animationDelay: {
  			'0': '0ms',
  			'50': '50ms',
  			'100': '100ms',
  			'150': '150ms',
  			'200': '200ms',
  			'250': '250ms',
  			'300': '300ms',
  			'350': '350ms',
  			'400': '400ms',
  			'450': '450ms',
  			'500': '500ms',
  			'600': '600ms',
  			'700': '700ms',
  			'800': '800ms'
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
