import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendTarget = env.VITE_BACKEND_TARGET || 'http://localhost:3000';

    return {
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
                    target: backendTarget,
                    changeOrigin: true,
                    secure: false,
                }
            }
        },
    };
})
