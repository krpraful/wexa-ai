/* ==============================================================
 * Script: vite.config.js
 * Purpose: Vite build tool configuration, Tailwind CSS plugin integration, and API proxy routing.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Initial Vite config with React & Tailwind plugins
 * - 04/08/2026 : Updated dev server port to 3099
 *
 * Notes:
 * - Proxies /api requests to Express server running on port 3001.
 * ============================================================== */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3099,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
