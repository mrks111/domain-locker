/// <reference types="vitest" />
import analog from '@analogjs/platform';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig( ({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/',
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
      outDir: 'dist',
      assetsDir: 'assets',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/app/components'),
        '@services': resolve(__dirname, './src/app/services'),
        '@typings': resolve(__dirname, './src/types'),
        '@guards': resolve(__dirname, './src/guards'),
        '@pages': resolve(__dirname, './src/pages'),
        '@styles': resolve(__dirname, './src/styles'),
        '@constants': resolve(__dirname, './src/constants'),
      }
    },
    plugins: [
      analog({
        prerender: {
          routes: [
            '/',
            '/login',
            '/domains',
            '/about',
            '/settings',
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
    envPrefix: ['VITE_', 'SUPABASE_', 'DL_'],
    define: {
      'import.meta.vitest': mode !== 'production',
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  };
});
