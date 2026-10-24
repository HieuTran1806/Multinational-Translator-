import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 127.0.0.1 (not "localhost"): Node may bind localhost to IPv6 ::1 only, which breaks http://127.0.0.1:5173.
  // Browsers still reach http://localhost:5173 by falling back to IPv4.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    env: { VITE_USE_MOCK: 'false' }, // tests exercise the real client even if .env.local enables the mock
  },
});
