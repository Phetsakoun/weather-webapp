// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import path from 'path'

export default defineConfig({
  plugins: [
    // เปิดใช้งาน transformAssetUrls สำหรับ Vuetify
    vue({
      template: { transformAssetUrls }
    }),
    // ใช้งาน Vuetify พร้อม auto-import components
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      // ให้ '@' ชี้ไปยังโฟลเดอร์ src จริง
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      overlay: false   // ปิด overlay ของ HMR
    },
    proxy: {
      // ทุกคำขอที่ขึ้นต้นด้วย /api จะส่งต่อไปยัง http://127.0.0.1:5000
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        // ถ้าฝั่ง backend ไม่ได้ mount ด้วย /api ให้ uncomment บรรทัดด้านล่างเพื่อตัด prefix ออก
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
