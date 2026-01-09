<!-- src/pages/Home.vue -->
<!--
  🔐 ວິທີເຂົ້າສູ່ລະບົບ Admin:
  1. ໄປທີ່ URL: /login (ແລະ login ດ້ວຍບັນຊີ admin)
  2. ຫຼືກົດປຸ່ມ: a-d-m-i-n ຕາມລຳດັບໃນໜ້ານີ້ ແລ້ວ login
  3. ຫຼືໄປທີ່ URL: /admin ໂດຍກົງ (ຕ້ອງ login ກ່ອນ)
-->
<template>
  <div class="flex-1 flex flex-col">
    <!-- User Notification Banner -->
    <UserNotificationBanner />

    <!-- Forecast section: full-bleed blue background with selector -->
    <section class="relative w-screen left-1/2 transform -translate-x-1/2 bg-blue-600 text-white pt-6 pb-6 flex-1">
    <div class="max-w-7xl mx-auto px-4 space-y-6">
      <!-- Province Selector -->
      <div class="flex justify-center">
        <div class="bg-white rounded-2xl shadow-xl border border-blue-100 px-8 py-4 flex items-center space-x-4 backdrop-blur-sm">
          <div class="flex items-center space-x-3">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <label class="text-lg font-bold text-gray-800 font-lao">ເລືອກແຂວງ:</label>
          </div>
          <select 
            v-model="selectedProvince" 
            @change="onSelectProvince" 
            class="bg-white border-2 border-blue-200 rounded-xl px-4 py-3 text-gray-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 hover:border-blue-300 shadow-sm min-w-[250px] font-lao"
            :disabled="loadingLocations"
          >
            <option v-if="loadingLocations" value="" disabled class="py-2 font-lao">
              ກຳລັງໂຫຼດ...
            </option>
            <option v-else-if="provinceLocations.length === 0" value="" disabled class="py-2 font-lao">
              ບໍ່ພົບຂໍ້ມູນ
            </option>
            <option v-else v-for="p in provinceLocations" :key="`${p.province}-${p.city}`" :value="p.province" class="py-2 font-lao">
              {{ p.province }} – {{ p.city }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Forecast Cards -->
      <TomorrowForecast :map-center="mapCenter" />
      <SevenDayForecast :mapCenter="mapCenter" :cityId="1" :lstmData="lstmData" />
    </div>
  </section>

  <!-- Map & Detail Panel section -->
  <section class="relative w-screen left-1/2 transform -translate-x-1/2 bg-gray-100 px-4 pb-6">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch gap-6">
      <!-- Map column -->
      <div class="md:w-2/3 bg-white rounded-lg shadow flex flex-col p-4">
        <WeatherMapView
          v-model:mapCenter="mapCenter"
          :provinces="provinceLocations"
          @locationChange="onMapLocationChange"
          @lstm-data="onLstmData"
          class="w-full h-full"
        />
      </div>
      <!-- Detail panel (ຂວາ) -->
      <div class="w-[450px] flex flex-col">
        <!-- ກຣາຟ LSTM -->
        <WeatherLSTMChart
          :lstm-data="lstmData"
          :location-name="locationName"
          :coordinates="mapCenter"
        />
      </div>
    </div>
  </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../plugins/axios'
import TomorrowForecast     from '../components/TomorrowForecast.vue'
import SevenDayForecast     from '../components/SevenDayForecast.vue'
import WeatherMapView       from '../components/WeatherMapView.vue'
import UserNotificationBanner from '../components/UserNotificationBanner.vue'
import WeatherLSTMChart from '../components/WeatherLSTMChart.vue'
import { debounce } from 'lodash'

// Dynamic province locations from API
const provinceLocations = ref([])
const loadingLocations = ref(true)

// Initial state - will be set after loading data
const selectedProvince = ref('')
const mapCenter = ref([17.9757, 102.6331]) // Default to Vientiane
const locationName = ref('')
const selectedCity = ref(null)
// state ສຳລັບຂໍ້ມູນ weather, lstm, ແລະ timestamp
const weatherData = ref(null)
const lstmData = ref({
  times: [],
  temperatures: [],
  precipitations: [],
})
const lastUpdate = ref(null)

// helper ສະແດງວັນທີ່ແບບ locale
const lastUpdateDisplay = computed(() => {
  if (!lastUpdate.value) return '-'
  const d = new Date(lastUpdate.value)
  return d.toLocaleString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})

// ຟັງຊັນດຶງຂໍ້ມູນຈາກ backend (MySQL)
async function fetchWeatherData(lat, lon) {
  try {
    const res = await api.get(`/api/weather/current?lat=${lat}&lon=${lon}`)
    weatherData.value = res.data
    lastUpdate.value = res.data.lastUpdate || res.data.updatedAt || new Date()
  } catch (e) {
    weatherData.value = null
    lastUpdate.value = new Date()
    console.error('ການດຶງຂໍ້ມູນ weather ຈາກ backend ຜິດພາດ', e)
  }
}

// === ສ້າງຟັງຊັນ debounce ===
const fetchWeatherDataDebounced = debounce(fetchWeatherData, 2000) // 2 ວິນາທີ

// ເມື່ອເລືອກແຂວງໃໝ່
function onSelectProvince() {
  const p = provinceLocations.value.find(x => x.province === selectedProvince.value)
  if (p) {
    mapCenter.value    = [...p.center]
    locationName.value = `${p.province} – ${p.city}`
    lstmData.value     = { temperatures: [], windSpeeds: [] }
    fetchWeatherDataDebounced(p.center[0], p.center[1]) // ໃຊ້ debounce
  }
}

// ລະບົບໂຫຼດຂໍ້ມູນແຂວງ/ເມືອງຈາກ API
async function loadProvinceLocations() {
  try {
    loadingLocations.value = true
    console.log('Loading province locations from API...')
    const response = await api.get('/api/provinces/public/locations')
    console.log('API Response:', response.data)
    
    const locations = []
    
    // ແປງຂໍ້ມູນຈາກ API ເປັນຮູບແບບທີ່ Home component ໃຊ້ໄດ້
    response.data.forEach(province => {
      if (province.cities && province.cities.length > 0) {
        // ເອົາແຕ່ເມືອງທີ່ມີສະຖານະ active ແລະ ມີພິກັດ
        province.cities.forEach(city => {
          if (city.lat && city.lon) {
            locations.push({
              province: province.name_th || province.name_en || province.name,
              city: city.name_th || city.name_en || city.name,
              center: [parseFloat(city.lat), parseFloat(city.lon)],
              id: city.id,
              region: city.region
            })
          }
        })
      }
    })
    
    console.log('Processed locations:', locations)
    
    if (locations.length > 0) {
      provinceLocations.value = locations
      
      // ຕັ້ງຄ່າເລີ່ມຕົ້ນກັບທຳເລແຮກ
      selectedProvince.value = locations[0].province
      mapCenter.value = [...locations[0].center]
      locationName.value = `${locations[0].province} – ${locations[0].city}`
      
      console.log('Set initial location:', locationName.value)
      console.log(`✅ Loaded ${locations.length} active locations from ${response.data.length} provinces`)
    } else {
      console.warn('No active cities found, using fallback data')
      // fallback ໃຊ້ຂໍ້ມູນຄົງທີ່
      provinceLocations.value = [
        { province: 'ນະຄອນຫລວງວຽງຈັນ', city: 'ນະຄອນຫລວງວຽງຈັນ', center: [17.9757, 102.6331] }
      ]
      selectedProvince.value = provinceLocations.value[0].province
      locationName.value = `${provinceLocations.value[0].province} – ${provinceLocations.value[0].city}`
    }
    
  } catch (error) {
    console.error('Error loading province locations:', error)
    // ຖ້າເກີດຜິດພາດ ໃຊ້ຂໍ້ມູນຄົງທີ່
    provinceLocations.value = [
      { province: 'ນະຄອນຫລວງວຽງຈັນ', city: 'ນະຄອນຫລວງວຽງຈັນ', center: [17.9757, 102.6331] }
    ]
    selectedProvince.value = provinceLocations.value[0].province
    locationName.value = `${provinceLocations.value[0].province} – ${provinceLocations.value[0].city}`
  } finally {
    loadingLocations.value = false
  }
}

// ເມື່ອຄລິກບນແຜນທີ່/Marker ໃໝ່
function onMapLocationChange({ lat, lon, name }) {
  mapCenter.value    = [lat, lon]
  locationName.value = name
  lstmData.value     = { temperatures: [], windSpeeds: [] }
  fetchWeatherDataDebounced(lat, lon) // ໃຊ້ debounce
}

// ຮັບຂໍ້ມູນ LSTM ຈາກ WeatherMapView (ເຊັ່ນເມື່ອເອີ້ນ /predict)
function onLstmData(data) {
  console.log('Home.vue - LSTM DATA received:', data)
  
  // ກວດສອບວ່າຂໍ້ມູນມີໂຄງສ້າງທີ່ຄາດໄວ້ຈາກ backend
  const mlData = data?.data || data
  
  if (mlData && mlData.predictions) {
    // ຂໍ້ມູນທີ່ໄດ້ຈາກ ML API ມີໂຄງສ້າງດັ່ງນີ້:
    // { success: true, data: { status: 'success', predictions: { times: [...], temperatures: [...], precipitations: [...] } } }
    const newLstmData = {
      times: mlData.predictions.times || [],
      temperatures: mlData.predictions.temperatures || [],
      precipitations: mlData.predictions.precipitations || [],
      lastUpdate: new Date()
    }
    console.log('Home.vue - Setting lstmData to:', newLstmData)
    lstmData.value = newLstmData
  } else if (Array.isArray(data)) {
    // fallback ສຳລັບຂໍ້ມູນແບບເກົ່າ
    lstmData.value = {
      temperatures: data.map(d => d.temperature),
      windSpeeds: data.map(d => d.humidity),
      lastUpdate: new Date()
    }
  } else {
    console.log('Home.vue - No valid LSTM data, resetting')
    lstmData.value = { temperatures: [], precipitations: [] }
  }
  if (data.lastUpdate) lastUpdate.value = data.lastUpdate
}


// ໂຫຼດຂໍ້ມູນແຂວງ/ເມືອງ ແລະ ຂໍ້ມູນສະພາບອາກາດເຮືອນແຮກ
onMounted(async () => {
  await loadProvinceLocations()
  // ໂຫຼດຂໍ້ມູນສະພາບອາກາດຮອບແຮກ
  fetchWeatherData(mapCenter.value[0], mapCenter.value[1])
})

</script>
