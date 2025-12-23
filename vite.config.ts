
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Since all files are in the root, no special root config is needed,
  // but we ensure the build processes the index.html correctly.
  plugins: [react()],
  define: {
    'process.env': process.env
  }
});
