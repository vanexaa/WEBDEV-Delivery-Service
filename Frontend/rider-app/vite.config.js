import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: false
  },
  resolve: {
    alias: {
      '@shared-mock-data': path.resolve(__dirname, '../shared-mock-data')
    }
  }
});
