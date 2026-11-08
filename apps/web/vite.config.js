import { defineConfig } from 'vite';
export default defineConfig({
    esbuild: { jsx: 'automatic' },
    server: {
        host: 'localhost',
        port: 5180,
        strictPort: true,
        proxy: { '/api': 'http://localhost:8787' }
    },
    preview: {
        host: 'localhost',
        port: 5180,
        strictPort: true,
        proxy: { '/api': 'http://localhost:8787' }
    }
});
