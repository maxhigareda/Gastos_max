/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable manual dark mode toggle if needed, or system preference
    theme: {
        extend: {
            colors: {
                // We can add custom colors here if needed, but Tailwind's default palette is robust.
                // For 'dark mode' minimalist, we'll rely on slate/zinc/neutral.
            },
            fontFamily: {
                // We will load a font like Outfit in index.html
                sans: ['Outfit', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
