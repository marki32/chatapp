import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base:"/jgh/",
  envPrefix: 'VITE_'  // This ensures Vite only exposes env vars prefixed with VITE_
});