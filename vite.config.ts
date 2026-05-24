import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: './'
        },
        {
          src: 'public/icon.png',
          dest: './'
        }
      ]
    })
  ],
  base: '/',
  build: {
    target: 'es2022',
    outDir: 'dist'
  }
})
