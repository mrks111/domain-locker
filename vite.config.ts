/// <reference types="vitest" />
import analog from '@analogjs/platform';
import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import * as path from 'node:path';

export default defineConfig( ({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')
  const buildPreset = env['BUILD_PRESET'] || env['NITRO_PRESET'] || 'node';

  const nitroPreset = (() => {
    switch (buildPreset) {
      case 'vercel':
        console.log('🔼 Building for Vercel');
        return 'vercel';
      case 'netlify':
        console.log('🪁 Building for Netlify');
        return 'netlify';
      default:
        console.log('🚀 Building for Node.js');
        return 'node-server';
    }
  })();

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
        '~': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      analog({
        prerender: {
          routes: [ // Unauthenticated SSG routes
            '/',
            '/login',
            '/about',
            '/about/*',
          ],
          sitemap: {
            host: 'https://domain-locker.com',
          },
        },
        nitro: {
          preset: nitroPreset,
        },
        content: {
          highlighter: 'prism',
          prismOptions: {
            additionalLangs: ['diff', 'yaml'],
          },
        },
      }),
      viteStaticCopy({
        targets: [
          {
            // Copy the primeNG file(s) you need.
            // e.g. the "vela-orange" theme => rename to "vela-orange-core.css"
            src: 'node_modules/primeng/resources/themes/vela-orange/theme.css',
            dest: './themes',
            rename: 'orange-dark.css'
          },
          // Repeat for other primeNG theme files you want to copy
          // e.g. for `vela-blue`, etc.
          // {
          //   src: 'node_modules/primeng/resources/themes/vela-blue/theme.css',
          //   dest: 'themes/primeng/',
          //   rename: 'vela-blue-core.css'
          // },
        ],
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
