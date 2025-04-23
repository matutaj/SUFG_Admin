import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
//import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    /*    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
      },
    }), */
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
});
