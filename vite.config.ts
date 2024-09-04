/// <reference types="vitest" />
import analog from '@analogjs/platform';
import { defineConfig } from 'vite';

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
      sourcemap: mode === 'development' ? 'inline' : false,
      outDir: 'dist/client',
      assetsDir: 'assets',
    },
    plugins: [
      analog({
        prerender: {
          routes: [
            '/',
            '/login',
            '/domains',
            '/about',
            '/*',
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
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env['VITE_SUPABASE_URL']),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env['VITE_SUPABASE_ANON_KEY']),
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  };
});
