import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The user web app runs on its own port (5173 is the admin app) and reaches the backend through a
// dev proxy, so API calls and audio/image streams stay same-origin: no CORS setup needed.
// The browser still sends `Origin: http://localhost:5174` (always on POST), which the backend would reject
// as a cross-origin request, so the proxy drops it — exactly like a same-domain production deployment.
// 127.0.0.1 (not "localhost"): Docker publishes the backend on IPv4 only; Node may try IPv6 ::1 first.
// DEV_API_PROXY_TARGET (no VITE_ prefix, never bundled) points the proxy elsewhere, e.g. the
// local-neon backend on 18081. *.trycloudflare.com is allowed so a phone can reach the dev server
// over HTTPS through `cloudflared tunnel` (the camera QR scanner needs a secure context).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: loadEnv(mode, process.cwd(), '').DEV_API_PROXY_TARGET || 'http://127.0.0.1:18080',
        changeOrigin: true,
        configure: (proxy) => proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin')),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
}));
