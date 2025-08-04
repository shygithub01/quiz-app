/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Claude's Purple Theme System
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Enhanced Purple Primary Colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          50: "#faf7ff",
          100: "#f3ecff",
          200: "#e8dcff",
          300: "#d6c1ff",
          400: "#bc97ff",
          500: "#a266ff",
          600: "#8b3dff",
          700: "#7c2bfe",
          800: "#6b26d4",
          900: "#5a1fb0",
          950: "#3a0f75",
        },
        
        // Claude's Signature Colors
        claude: {
          purple: "#8b3dff",
          "purple-light": "#a266ff",
          "purple-dark": "#6b26d4",
          orange: "#ff6b35",
          "orange-light": "#ff8a65",
          "orange-dark": "#e55100",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          50: "#f0fdf4",
          500: "#22c55e",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          50: "#fffbeb",
          500: "#f59e0b",
        },
        error: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          50: "#fef2f2",
          500: "#ef4444",
        },
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      
      // Claude's Beautiful Animations
      animation: {
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "slide-in-right": "slide-in-right 0.5s ease-out forwards",
        "slide-in-left": "slide-in-left 0.5s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 3s ease-in-out infinite",
        "gradient-x": "gradient-x 3s ease infinite",
        "gradient-y": "gradient-y 3s ease infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ripple": "ripple 0.6s linear",
      },
      
      keyframes: {
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "glow": {
          "0%": { boxShadow: "0 0 20px rgba(139, 61, 255, 0.5)" },
          "100%": { boxShadow: "0 0 30px rgba(139, 61, 255, 0.8)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "gradient-y": {
          "0%, 100%": { backgroundPosition: "50% 0%" },
          "50%": { backgroundPosition: "50% 100%" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px rgba(139, 61, 255, 0.4)",
            transform: "scale(1)"
          },
          "50%": { 
            boxShadow: "0 0 40px rgba(139, 61, 255, 0.8)",
            transform: "scale(1.05)"
          },
        },
        "ripple": {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
      },
      
      // Backdrop Blur & Glass Effects
      backdropBlur: {
        xs: "2px",
        sm: "4px", 
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "40px",
      },
      
      // Box Shadows for Glass Effects
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.1)",
        "glass-lg": "0 12px 40px rgba(0, 0, 0, 0.15)",
        "glass-xl": "0 20px 60px rgba(0, 0, 0, 0.2)",
        glow: "0 0 20px rgba(139, 61, 255, 0.5)",
        "glow-lg": "0 0 40px rgba(139, 61, 255, 0.6)",
        "glow-xl": "0 0 60px rgba(139, 61, 255, 0.7)",
      },
      
      // Background Gradients
      backgroundImage: {
        "claude-gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "purple-gradient": "linear-gradient(135deg, #8b3dff 0%, #6b26d4 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "shimmer": "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
      },
      
      // Glass Morphism Utilities
      backgroundSize: {
        "300%": "300%",
      },
    },
  },
  plugins: [
    // Custom Glass Morphism Plugin
    function({ addUtilities }) {
      addUtilities({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-strong': {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.glass-subtle': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      })
    }
  ],
}
