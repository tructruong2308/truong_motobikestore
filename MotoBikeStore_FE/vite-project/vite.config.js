// vite.config.ts (hoặc vite.config.js)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // ép dùng classic để React không bị tree-shake -> tránh lỗi "useEffect of null"
    react({ jsxRuntime: 'classic' })
  ],
})
