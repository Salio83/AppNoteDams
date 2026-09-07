/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', 'sans-serif'],
                display: ['Caprasimo', 'cursive'],
            },
            colors: {
                bg: 'var(--bg)',
                surface: 'var(--surface)',
                ink: 'var(--ink)',
                muted: 'var(--muted)',
                accent: 'var(--accent)',
                'accent-solid': 'var(--accent-solid)',
                rule: 'var(--rule)',
                t1: 'var(--t1-bg)',
                t1ink: 'var(--t1-ink)',
                t2: 'var(--t2-bg)',
                t2ink: 'var(--t2-ink)',
                t3: 'var(--t3-bg)',
                t3ink: 'var(--t3-ink)',
                t4: 'var(--t4-bg)',
                t4ink: 'var(--t4-ink)',
            },
        },
    },
    plugins: [],
}
