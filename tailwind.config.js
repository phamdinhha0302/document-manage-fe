/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}', '*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#48cae4',
                    mid: '#B74E4C',
                    light: '#C16063'
                },
                dark: '#1F2937',
                light: '#E4E4E4'
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif']
            },
            backgroundColor: {
                'black-01': 'rgba(0, 0, 0, 0.01)',
                primary: '#48cae4'
            },
            boxShadow: {
                medium: '0px 6px 15px -2px rgba(16, 24, 40, 0.08)'
            },
            screens: {
                xs: '390px'
            }
        }
    },
    plugins: [
        require('@tailwindcss/line-clamp')
    ]
}
