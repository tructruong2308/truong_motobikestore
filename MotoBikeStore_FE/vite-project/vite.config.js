// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // quay lại mặc định (automatic runtime)
    react()
  ],
  // bật sourcemap để debug nếu cần
  build: { sourcemap: true }
})
