import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const publicReadProxy: ProxyOptions = {
    target: `https://${env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo'}.apicdn.sanity.io`,
    changeOrigin: true,
    rewrite: path => path.replace(/^\/__catalogue_sanity/, ''),
    configure(proxy) {
      proxy.on('proxyReq', (request, incoming) => {
        // Local-only public reads: never forward credentials or mutation requests.
        request.removeHeader('origin'); request.removeHeader('cookie'); request.removeHeader('authorization');
        if (incoming.method !== 'GET' || !incoming.url?.includes('/data/query/')) request.destroy();
      });
    },
  };
  return { plugins: [react(), tailwindcss()], server: { proxy: { '/__catalogue_sanity': publicReadProxy } }, preview: { proxy: { '/__catalogue_sanity': publicReadProxy } } };
});
