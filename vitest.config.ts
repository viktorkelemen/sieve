import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { stylex } from 'vite-plugin-stylex-dev';

export default defineConfig({
    plugins: [react(), stylex()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [], // Add setup file if needed later
    },
});
