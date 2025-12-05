import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Cấu hình Server & Proxy
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        secure: false,
      },
    },
  },
  
  // Cấu hình Plugins (Chỉ khai báo 1 lần duy nhất ở đây)
  plugins: [
    react(),
    tailwindcss(),
  ],
})