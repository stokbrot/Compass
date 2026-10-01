import { defineConfig } from 'vite';

export default defineConfig({
  base: '/game/',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: 'dynamic-import',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@babylonjs')) {
              return 'babylon';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});