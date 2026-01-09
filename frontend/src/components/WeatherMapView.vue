<!-- src/components/WeatherMapView.vue -->
<template>
  <section>
    <h2 class="text-xl font-bold mb-4">ແຜນທີ່</h2>
    <div class="relative">
      <!-- Loading overlay -->
      <div
        v-if="isMapLoading"
        class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10"
      >
        ກຳລັງໂຫລດແຜນທີ່...
      </div>
      <!-- Map container always present -->
      <div id="map" class="h-[600px] rounded shadow border"></div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../plugins/axios'
import { debounce } from 'lodash'

const props = defineProps({
  mapCenter: {
    type: Array,
    required: true
  },
  provinces: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:mapCenter', 'locationChange', 'lstm-data'])
const isMapLoading = ref(true)
let map = null
let marker = null
let blueIcon = null

async function initMap() {
  if (typeof window === 'undefined' || !window.L) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => createMap()
    document.head.appendChild(script)
  } else {
    createMap()
  }
}

function createMap() {
  const mapEl = document.getElementById('map')
  if (!mapEl) return

  map = window.L.map(mapEl).setView(props.mapCenter, 7)

  // Base map
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  // Radar RainViewer Overlay
  window.L.tileLayer(
    'https://tilecache.rainviewer.com/v2/radar/nowcast/256/{z}/{x}/{y}/2/1_1.png',
    {
      opacity: 0.6,
      attribution: 'Radar &copy; RainViewer'
    }
  ).addTo(map)

  // ไม่สร้าง marker สำหรับแต่ละจังหวัดอีกต่อไป
  // props.provinces.forEach(p => { ... })

  // User click map → สร้าง marker ใหม่
  map.on('click', e => {
    const lat = e.latlng.lat
    const lon = e.latlng.lng
    handleSelection(lat, lon, `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
  })

  // โหลดขอบเขต GeoJSON
  fetch('/laos_provinces.geojson')
    .then(res => res.json())
    .then(geo => {
      window.L.geoJSON(geo, {
        style: { color: '#2563eb', fillColor: '#93c5fd', fillOpacity: 0.3 }
      }).addTo(map)
    })
    .catch(err => console.error('Error loading GeoJSON:', err))

  // สร้าง blue icon สำหรับ marker
  blueIcon = window.L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  isMapLoading.value = false
}

// สร้าง marker ใหม่ที่ตำแหน่งเลือก (ลบ marker เก่าอัตโนมัติ)
function setMarker(lat, lon) {
  if (marker) {
    marker.remove()
    marker = null
  }
  marker = window.L.marker([lat, lon], { icon: blueIcon }).addTo(map)
  map.setView([lat, lon], map.getZoom())
}

// === Debounce LSTM ===
const fetchLSTM = debounce(async (lat, lon) => {
  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    isNaN(lat) ||
    isNaN(lon)
  ) {
    console.error('Invalid lat/lon for LSTM API:', lat, lon)
    return
  }
  try {
    console.log('Calling LSTM API with:', { lat, lon })
    const res = await api.post('/api/predict/fetch-predict-save', { lat, lon })
    console.log('LSTM API response:', res.data)
    emit('lstm-data', res.data)
  } catch (err) {
    console.error('Error fetching LSTM data:', err)
  }
}, 2000) // 2 วินาที

// handleSelection มีตัวเดียว! ไม่ซ้ำ
function handleSelection(lat, lon, name) {
  emit('update:mapCenter', [lat, lon])
  emit('locationChange', { lat, lon, name })
  setMarker(lat, lon)
  fetchLSTM(lat, lon)  // เรียกผ่าน debounce
}

// updateMarker: จะใช้เมื่อ mapCenter เปลี่ยนจาก parent
function updateMarker() {
  if (map && marker) {
    marker.setLatLng(props.mapCenter)
    map.setView(props.mapCenter, map.getZoom())
  }
}

onMounted(() => initMap())

watch(() => props.mapCenter, () => {
  if (marker) updateMarker()
}, { deep: true })

defineExpose({ updateMarker })
</script>
