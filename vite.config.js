import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        open: true,
        proxy: {
            '/jsp': {
                target: 'https://proseconsult.umontpellier.fr',
                changeOrigin: true,
                secure: false,
            },
            '/api': {
                target: 'http://backend:3000',
                changeOrigin: true,
                secure: false,
            }
        }
    },
})
