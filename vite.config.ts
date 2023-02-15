/// <reference types="vitest" />
import path, { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/lib')
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/lib/']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, './src/lib/index.ts'),
      name: 'CanvasKit',
      fileName: 'canvas-kit'
    }
  },
  test: {
    setupFiles: ['./vitest.setup.ts'],
    environment: 'jsdom'
  }
})