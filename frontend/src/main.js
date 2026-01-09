// src/main.js

// 1. โหลดสไตล์ของ Vuetify และ CSS หลักของโปรเจกต์ (เช่น Tailwind)
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'  // เพิ่มบรรทัดนี้
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import HighchartsVue from 'highcharts-vue'

// 2. โหลด Vue Router และตั้งค่า
import router from './router'

// 3. โหลด Axios plugin สำหรับจัดการ API requests และ authentication
import './plugins/axios'

// 3. โหลด Leaflet core + CSS
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 3.1 แก้ปัญหาไอคอน marker ไม่แสดงใน Vite
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl       from 'leaflet/dist/images/marker-icon.png'
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

// 3.2 ให้เรียกใช้งาน L ได้ทั่วทั้งโปรเจกต์ (optionally)
globalThis.L = L

// 4. นำเข้า Vue-Leaflet components
import {
  LMap,
  LTileLayer,
  LMarker,
  LPopup,
  LGeoJson
} from '@vue-leaflet/vue-leaflet'

// 5. สร้างแอป และลงทะเบียน plugin/components
const app = createApp(App)
app.use(HighchartsVue)
app
  .use(vuetify)    // Vuetify
  .use(router)     // Vue Router

// ลงทะเบียน Vue-Leaflet เป็น global components
app
  .component('LMap',       LMap)
  .component('LTileLayer', LTileLayer)
  .component('LMarker',    LMarker)
  .component('LPopup',     LPopup)
  .component('LGeoJson',   LGeoJson)

// 6. mount แอป
app.mount('#app')
