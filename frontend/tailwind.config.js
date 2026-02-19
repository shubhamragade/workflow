/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#f8fafc", // Slate 50
                surface: "#ffffff",    // White
                primary: {
                    DEFAULT: "#2563eb", // Blue 600
                    hover: "#1d4ed8",   // Blue 700
                    muted: "rgba(37, 99, 235, 0.1)",
                },
                secondary: "#f43f5e",   // Rose 500 (keeping pop color but adjusting)
                border: "#e2e8f0",      // Slate 200 - Visible border
                glass: "rgba(255, 255, 255, 0.9)", // Almost opaque
                "text-main": "#0f172a", // Slate 900 - High contrast
                "text-muted": "#64748b", // Slate 500 - Readable gray
                success: "#059669",     // Emerald 600
                warning: "#d97706",     // Amber 600
                error: "#dc2626",       // Red 600
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            fontFamily: {
                sans: ['"Outfit"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
            }
        },
    },
    plugins: [],
}
