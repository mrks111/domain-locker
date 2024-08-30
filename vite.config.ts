/// <reference types="vitest" />
import analog from '@analogjs/platform';
import { defineConfig } from 'vite';


// https://vitejs.dev/config/
export default defineConfig( ({ mode }) => {
  return {
    publicDir: 'src/assets',
    optimizeDeps: {
      include: ['@angular/common'],
    },
    ssr: {
      noExternal: [
        '@spartan-ng/**',
        '@angular/cdk/**',
        '@ng-icons/**',
      ]
    },
    build: {
      target: ['es2020'],
    },
    plugins: [
      analog({
        prerender: {
          routes: [
            '/',
            '/domains',
            '/about',
            // Add other routes as needed
          ],
          sitemap: {
            host: 'https://domain-locker.as93.net',
          },
        },
      }),
    ],

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test.ts'],
      include: ['**/*.spec.ts'],
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
