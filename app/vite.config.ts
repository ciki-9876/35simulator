import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// Events and data live at the repository root (../events, ../data), outside the app folder.
// Relative asset paths let the build run from any folder, such as the GitHub Pages project path.
export default defineConfig({
  base: './',
  plugins: [preact()],
  server: { fs: { allow: ['..'] } },
})
