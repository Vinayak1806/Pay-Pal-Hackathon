/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8FA',
        surface: '#FFFFFF',
        ink: {
          primary: '#171A21',
          secondary: '#667085',
          muted: '#98A2B3'
        },
        border: {
          subtle: '#E6E8EC',
          strong: '#D0D5DD'
        },
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          subtle: '#EFF4FF',
          border: '#BFDBFE'
        },
        status: {
          success: '#15803D',
          'success-subtle': '#F0FDF4',
          'success-border': '#BBF7D0',
          warning: '#B45309',
          'warning-subtle': '#FFFBEB',
          'warning-border': '#FED7AA',
          danger: '#B42318',
          'danger-subtle': '#FEF2F2',
          'danger-border': '#FECACA'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(16, 24, 40, 0.05), 0 1px 2px 0 rgba(16, 24, 40, 0.03)',
        popover: '0 4px 6px -2px rgba(16, 24, 40, 0.03), 0 12px 16px -4px rgba(16, 24, 40, 0.08)'
      }
    }
  },
  plugins: []
}
