import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@features': resolve(__dirname, 'app/features'),
      '@entities': resolve(__dirname, 'app/entities'),
      '@shared': resolve(__dirname, 'app/shared'),
      '@assets': resolve(__dirname, 'app/assets'),
      '~': resolve(__dirname, 'app'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['app/**/*.{test,spec}.ts', 'tests/unit/**/*.{test,spec}.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    setupFiles: ['./tests/setup.ts'],
  },
})
