import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendTarget = env.VITE_BACKEND_TARGET || 'http://localhost:3000';

    return {
        plugins: [react()],

        // Pointe vers les fichiers de config déplacés dans config/
        css: {
            postcss: './config/postcss.config.js',
        },

        // Alias pour importer config/ue.json facilement depuis le src/
        resolve: {
            alias: {
                '@config': path.resolve(__dirname, './config'),
            },
        },

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

