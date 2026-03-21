import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			bg: 'hsl(var(--color-bg))',
  			surface: 'hsl(var(--color-surface))',
  			'surface-2': 'hsl(var(--color-surface-2))',
  			border: 'hsl(var(--color-border))',
  			'border-2': 'hsl(var(--color-border-2))',
  			t1: 'hsl(var(--color-text-1))',
  			t2: 'hsl(var(--color-text-2))',
  			t3: 'hsl(var(--color-text-3))',
  			accent: 'hsl(var(--color-accent))',
  			success: 'hsl(var(--color-success))',
  			warning: 'hsl(var(--color-warning))',
  			danger: 'hsl(var(--color-danger))',
  			gold: 'hsl(var(--color-gold))'
  		},
  		borderRadius: {
  			sm: 'var(--radius-sm)',
  			md: 'var(--radius-md)',
  			lg: 'var(--radius-lg)',
  			xl: 'var(--radius-xl)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'2xs': [
  				'11px',
  				{
  					lineHeight: '1.4'
  				}
  			],
  			xs: [
  				'12px',
  				{
  					lineHeight: '1.4'
  				}
  			],
  			sm: [
  				'13px',
  				{
  					lineHeight: '1.5'
  				}
  			],
  			base: [
  				'14px',
  				{
  					lineHeight: '1.5'
  				}
  			],
  			md: [
  				'16px',
  				{
  					lineHeight: '1.5'
  				}
  			],
  			lg: [
  				'18px',
  				{
  					lineHeight: '1.4'
  				}
  			],
  			xl: [
  				'24px',
  				{
  					lineHeight: '1.3'
  				}
  			],
  			'2xl': [
  				'32px',
  				{
  					lineHeight: '1.2'
  				}
  			],
  			'3xl': [
  				'48px',
  				{
  					lineHeight: '1.1'
  				}
  			]
  		},
  		animation: {
  			'fade-in': 'fadeIn 200ms ease forwards',
  			'slide-up': 'slideUp 250ms ease forwards',
  			'slide-down': 'slideDown 250ms ease forwards',
  			'scale-in': 'scaleIn 200ms ease forwards',
  			'spin-slow': 'spin 3s linear infinite',
  			'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		keyframes: {
  			fadeIn: {
  				from: {
  					opacity: '0'
  				},
  				to: {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(8px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideDown: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(-8px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			scaleIn: {
  				from: {
  					opacity: '0',
  					transform: 'scale(0.96)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			pulseSoft: {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.5'
  				}
  			},
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
  			}
  		},
  		boxShadow: {
  			'glow-accent': '0 0 0 3px hsl(var(--color-accent) / 0.15)',
  			'glow-success': '0 0 0 3px hsl(var(--color-success) / 0.15)',
  			'glow-danger': '0 0 0 3px hsl(var(--color-danger) / 0.15)',
  			card: '0 1px 3px hsl(0 0% 0% / 0.3), 0 1px 2px hsl(0 0% 0% / 0.2)',
  			modal: '0 25px 50px hsl(0 0% 0% / 0.5)'
  		},
  		transitionTimingFunction: {
  			spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  		}
  	}
  },
  plugins: [],
}

export default config
