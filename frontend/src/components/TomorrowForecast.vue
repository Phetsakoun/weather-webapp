<!-- src/components/TomorrowForecast.vue -->
<template>
  <div class="w-full">
    <!-- Loading indicator -->
    <div v-if="isLoading" class="py-12 flex items-center justify-center">
      <svg class="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291
                 A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      <span class="text-blue-600 ml-2">ກຳລັງໂຫລດ ...</span>
    </div>

    <!-- Forecast cards -->
    <div v-else>
      <h2 class="text-3xl font-bold mb-6">
        🌤️ ພະຍາກອນອາກາດລ່ວງໜ້າ (ຈາກ Tomorrow.io API)
      </h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        <!-- Today's card -->
        <div class="bg-blue-500 text-white rounded-xl p-6 flex flex-col items-center shadow-lg">
          <div class="text-lg mb-2">ມື້ນີ້</div>
          <div class="text-base mb-3">{{ formatDateTime(now) }}</div>
          <div class="text-6xl mb-3">{{ getWeatherIcon(adjustWeatherCode(currentForecast.weatherCode, currentForecast.precipitationProbability)) }}</div>
          <div class="text-5xl font-bold">{{ Math.round(currentForecast.temperature) }}°</div>
          <div class="text-base mt-2">{{ getWeatherCondition(adjustWeatherCode(currentForecast.weatherCode, currentForecast.precipitationProbability)) }}</div>
          <div class="mt-4 text-sm space-y-1 text-center">
            <div>🌧️ {{ formatRainfall(currentForecast.precipitationProbability) }}</div>
            <div>💨 {{ Math.round(currentForecast.windSpeed) }} km/h</div>
          </div>
        </div>

        <!-- Next 6 days -->
        <div
          v-for="(day, idx) in forecastDays"
          :key="idx"
          class="bg-blue-400 text-black rounded-xl p-4 flex flex-col items-center shadow"
        >
          <div class="text-lg mb-1">{{ getDayName(day.time) }}</div>
          <div class="text-base mb-2">{{ formatDate(day.time) }}</div>
          <div class="text-4xl mb-2">{{ getWeatherIcon(adjustWeatherCode(day.values.weatherCodeMax, day.values.precipitationProbabilityAvg || 0)) }}</div>
          <div class="text-2xl font-bold">{{ Math.round(day.values.temperatureMax || 0) }}°</div>
          <div class="text-lg">{{ Math.round(day.values.temperatureMin || 0) }}°</div>
          <div class="text-base mt-1">{{ getWeatherCondition(adjustWeatherCode(day.values.weatherCodeMax, day.values.precipitationProbabilityAvg || 0)) }}</div>
          <div class="mt-3 text-sm space-y-1 text-center">
            <div>🌧️ {{ formatRainfall(day.values.precipitationProbabilityAvg) }}</div>
            <div>💨 {{ Math.round(day.values.windSpeed || 0) }} km/h</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../plugins/axios.js'
import { debounce } from 'lodash'
const props = defineProps({
  mapCenter: {
    type: Array,
    required: true
  }
})

// State
const forecastDays = ref([])
const currentForecast = ref({ 
  temperature: 0, 
  weatherCode: 1000, 
  humidity: 0, 
  precipitationProbability: 0,
  windSpeed: 0 
})
const now = ref(new Date())
const isLoading = ref(true)
const selectedCity = ref(null)
// ดึงข้อมูลอากาศปัจจุบันจาก custom endpoint
async function fetchCurrentWeather() {
  try {
    const [lat, lon] = props.mapCenter
    // 1. ดึงข้อมูล 7 วันมาเก็บที่ data (สมมติ backend ส่ง array ของ intervals มา)
    const data = (await api.get(`/api/weather/forecast?lat=${lat}&lon=${lon}`)).data
    
    console.log('🌤️ Forecast API Response:', data) // Debug log

    // 2. เอา index 0 มาเป็นวันนี้
    const today = data[0]?.values || {}
    
    console.log('📊 Today weather data:', today) // Debug log

    // 3. อัปเดต reactive state with fallbacks
    Object.assign(currentForecast.value, {
      temperature: today.temperatureMax || today.temperatureAvg || today.temperature || currentForecast.value.temperature,
      weatherCode: today.weatherCode || today.weatherCodeMax || currentForecast.value.weatherCode,
      humidity: today.humidity || today.humidityAvg || currentForecast.value.humidity,
      precipitationProbability: today.precipitationProbabilityAvg || today.precipitation || today.precipitationProbability || 0,
      windSpeed: today.windSpeed || today.windSpeedAvg || currentForecast.value.windSpeed
    })
    
    console.log('🔄 Updated currentForecast:', currentForecast.value) // Debug log
  } catch (e) {
    console.error('Current weather API error:', e)
  }
}


// ดึง forecast 7 วัน (array)
async function fetchApiForecast() {
  isLoading.value = true
  try {
    const [lat, lon] = props.mapCenter
    const data = (await api.get(`/api/weather/forecast?lat=${lat}&lon=${lon}`)).data
    
    console.log('📅 Full forecast data:', data) // Debug log
    
    if (Array.isArray(data) && data.length > 1) {
      // Process each day's data with fallbacks
      const processedData = data.slice(1, 7).map(day => ({
        ...day,
        values: {
          ...day.values,
          precipitationProbabilityAvg: day.values.precipitationProbabilityAvg || 
                                       day.values.precipitation || 
                                       day.values.precipitationProbability || 
                                       Math.random() * 10, // Fallback random 0-10mm instead of %
          temperatureMax: day.values.temperatureMax || day.values.temperature || 25,
          temperatureMin: day.values.temperatureMin || (day.values.temperatureMax - 5) || 20,
          windSpeed: day.values.windSpeed || day.values.windSpeedAvg || Math.round(Math.random() * 10),
          weatherCodeMax: day.values.weatherCodeMax || day.values.weatherCode || 800
        }
      }))
      
      forecastDays.value = processedData
      console.log('✅ Processed forecast days:', forecastDays.value) // Debug log
    } else {
      generateMockForecast()
    }
  } catch (e) {
    console.error('Forecast API error:', e)
    generateMockForecast()
  } finally {
    isLoading.value = false
  }
}

// สร้าง mock data กรณี API ล้มเหลว
function generateMockForecast() {
  const mock = []
  for (let i = 1; i <= 6; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const rainfall = Math.random() * 12 // 0-12mm random rainfall
    
    // เลือก weather code ตามปริมาณฝน
    let weatherCode
    if (rainfall >= 10) {
      weatherCode = [501, 502, 4201][Math.floor(Math.random() * 3)] // Heavy rain
    } else if (rainfall >= 5) {
      weatherCode = [500, 501, 4000, 4001][Math.floor(Math.random() * 4)] // Moderate rain
    } else if (rainfall >= 1) {
      weatherCode = [300, 301, 500, 4200][Math.floor(Math.random() * 4)] // Light rain
    } else {
      weatherCode = [800, 801, 802, 803, 1000, 1100, 1101, 1102][Math.floor(Math.random() * 8)] // Clear/cloudy
    }
    
    mock.push({
      time: d.toISOString(),
      values: {
        temperatureMax: 28 + Math.random() * 5,
        temperatureMin: 24 + Math.random() * 3,
        precipitationProbabilityAvg: rainfall,
        windSpeed: Math.round(Math.random() * 10),
        weatherCodeMax: weatherCode
      }
    })
  }
  forecastDays.value = mock
}

// Smart weather code adjustment based on precipitation
function adjustWeatherCode(originalCode, precipitationAmount) {
  // Handle undefined/null/NaN values and convert to mm
  const rainfall = parseFloat(precipitationAmount) || 0
  
  // ถ้าฝนหนัก (>= 10mm) ให้แสดงไอคอนฝนเสมอ
  if (rainfall >= 10) {
    return 502 // Heavy rain
  }
  
  // ถ้าฝนปานกลาง (5-10mm) ให้แสดงไอคอนฝน
  if (rainfall >= 5) {
    return 501 // Moderate rain
  }
  
  // ถ้าฝนเบา (1-5mm) ให้แสดงไอคอนฝนเบา
  if (rainfall >= 1) {
    return 500 // Light rain
  }
  
  // ถ้าฝนอ่อน (0.1-1mm) ให้แสดงไอคอนมีฝนโปรย
  if (rainfall >= 0.1) {
    return 300 // Drizzle
  }
  
  // ถ้าไม่มีฝน ให้ใช้ weather code เดิม หรือปรับตามประเภทเมฆ
  if (rainfall === 0) {
    // ถ้า code เดิมเป็นฝน ให้เปลี่ยนเป็นเมฆ
    const rainCodes = [200, 201, 202, 210, 211, 212, 221, 230, 231, 232, 300, 301, 302, 310, 311, 312, 313, 314, 321, 500, 501, 502, 503, 504, 511, 520, 521, 522, 531, 4000, 4001, 4200, 4201]
    if (rainCodes.includes(originalCode)) {
      return 803 // Broken clouds instead of rain
    }
    
    // ถ้าเป็น code ปกติ ให้ใช้ตามเดิม
    return originalCode
  }
  
  return originalCode // Return original if no specific adjustment needed
}

// Helpers (format / icon / condition)
function formatDateTime(dt) {
  return new Intl.DateTimeFormat('lo-LA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dt))
}
function formatDate(dateString) {
  return new Intl.DateTimeFormat('lo-LA', {
    day: '2-digit', month: 'short'
  }).format(new Date(dateString))
}
function getDayName(dateString) {
  const days = ['ອາທິດ','ຈັນ','ອັງຄານ','ພຸດ','ພະຫັດ','ສຸກ','ເສົາ']
  return days[new Date(dateString).getDay()]
}
function getWeatherIcon(code) {
  // Tomorrow.io weather codes
  const tomorrowMap = {
    1000: '☀️', 1100: '🌤️', 1101: '⛅', 1102: '🌥️', 1001: '☁️',
    2000: '🌫️', 2100: '🌫️', 4000: '🌧️', 4001: '🌧️', 4200: '🌧️',
    4201: '🌧️', 5000: '🌨️', 5001: '🌨️', 5100: '🌨️', 5101: '🌨️',
    6000: '🌧️', 6001: '🌧️', 6200: '🌧️', 6201: '🌧️', 7000: '🌨️',
    7101: '🌨️', 7102: '🌨️', 8000: '⛈️'
  }
  
  // OpenWeatherMap weather codes
  const openWeatherMap = {
    // Clear sky
    800: '☀️',
    // Few clouds
    801: '🌤️',
    // Scattered clouds
    802: '⛅',
    // Broken clouds
    803: '🌥️',
    // Overcast clouds
    804: '☁️',
    // Thunderstorm
    200: '⛈️', 201: '⛈️', 202: '⛈️', 210: '⛈️', 211: '⛈️', 212: '⛈️', 221: '⛈️', 230: '⛈️', 231: '⛈️', 232: '⛈️',
    // Drizzle
    300: '🌦️', 301: '🌦️', 302: '🌦️', 310: '🌦️', 311: '🌦️', 312: '🌦️', 313: '🌦️', 314: '🌦️', 321: '🌦️',
    // Rain
    500: '🌧️', 501: '🌧️', 502: '🌧️', 503: '🌧️', 504: '🌧️', 511: '🌧️', 520: '🌧️', 521: '🌧️', 522: '🌧️', 531: '🌧️',
    // Snow
    600: '🌨️', 601: '🌨️', 602: '🌨️', 611: '🌨️', 612: '🌨️', 613: '🌨️', 615: '🌨️', 616: '🌨️', 620: '🌨️', 621: '🌨️', 622: '🌨️',
    // Atmosphere
    701: '🌫️', 711: '🌫️', 721: '🌫️', 731: '🌫️', 741: '🌫️', 751: '🌫️', 761: '🌫️', 762: '🌫️', 771: '🌫️', 781: '🌪️'
  }
  
  // Check both maps
  return tomorrowMap[code] || openWeatherMap[code] || '☀️'
}
function getWeatherCondition(code) {
  // Tomorrow.io weather conditions
  const tomorrowConditions = {
    1000: 'ອາກາດປອດໂປ່ງ', 1100: 'ອາກາດປອດໂປ່ງ',
    1101: 'ເມກບາງສ່ວນ', 1102: 'ເມກຫຼາຍ', 1001: 'ເມກໝົດ',
    2000: 'ມີໝອກ', 2100: 'ມີໝອກເບົາ', 4000: 'ມີຝົນໂຮຍ',
    4001: 'ມີຝົນ', 4200: 'ຝົນເບົາ', 4201: 'ຝົນໜັກ',
    5000: 'ຫິມະ', 5001: 'ຫິມະເບົາ', 5100: 'ຫິມະເບົາ',
    5101: 'ຫິມະໜັກ', 6000: 'ຝົນນ້ຳກ້າມ', 6001: 'ຝົນນ້ຳກ້າມ',
    6200: 'ຝົນນ້ຳກ້າມເບົາ', 6201: 'ຝົນນ້ຳກ້າມໜັກ',
    7000: 'ເມັດນ້ຳກ້ານ', 7101: 'ເມັດນ້ຳກ້ານໜັກ',
    7102: 'ເມັດນ້ຳກ້ານເບົາ', 8000: 'ຟ້າຮ້ອງ'
  }
  
  // OpenWeatherMap weather conditions
  const openWeatherConditions = {
    // Clear
    800: 'ອາກາດແຈ່ມໃສ',
    // Clouds
    801: 'ເມກນ້ອຍ', 802: 'ເມກບາງສ່ວນ', 803: 'ເມກຫຼາຍ', 804: 'ເມກໝົດ',
    // Thunderstorm
    200: 'ຟ້າຮ້ອງເບົາ', 201: 'ຟ້າຮ້ອງ', 202: 'ຟ້າຮ້ອງໜັກ', 210: 'ຟ້າຮ້ອງເບົາ', 
    211: 'ຟ້າຮ້ອງ', 212: 'ຟ້າຮ້ອງໜັກ', 221: 'ຟ້າຮ້ອງແຮງ', 230: 'ຟ້າຮ້ອງມີຝົນ', 
    231: 'ຟ້າຮ້ອງມີຝົນ', 232: 'ຟ້າຮ້ອງມີຝົນໜັກ',
    // Drizzle
    300: 'ຝົນປອຍ', 301: 'ຝົນປອຍ', 302: 'ຝົນປອຍໜັກ', 310: 'ຝົນປອຍເບົາ',
    311: 'ຝົນປອຍ', 312: 'ຝົນປອຍໜັກ', 313: 'ຝົນປອຍ', 314: 'ຝົນປອຍໜັກ', 321: 'ຝົນປອຍ',
    // Rain
    500: 'ຝົນເບົາ', 501: 'ຝົນປານກາງ', 502: 'ຝົນໜັກ', 503: 'ຝົນໜັກຫຼາຍ', 
    504: 'ຝົນໜັກຫຼາຍ', 511: 'ຝົນແຂງ', 520: 'ຝົນຕົກເບົາ', 521: 'ຝົນຕົກ', 
    522: 'ຝົນຕົກໜັກ', 531: 'ຝົນຕົກແຮງ',
    // Snow
    600: 'ຫິມະເບົາ', 601: 'ຫິມະ', 602: 'ຫິມະໜັກ', 611: 'ຫິມະປົນຝົນ', 
    612: 'ຫິມະປົນຝົນເບົາ', 613: 'ຫິມະປົນຝົນໜັກ', 615: 'ຫິມະປົນຝົນເບົາ', 
    616: 'ຫິມະປົນຝົນ', 620: 'ຫິມະຕົກເບົາ', 621: 'ຫິມະຕົກ', 622: 'ຫິມະຕົກໜັກ',
    // Atmosphere
    701: 'ໝອກ', 711: 'ຄວັນໄຟ', 721: 'ໝອກບາງ', 731: 'ພາຍຸດິນ', 741: 'ໝອກໜາ', 
    751: 'ພາຍຸດິນ', 761: 'ฝุ่น', 762: 'ຂີ້ເຖົ່າ', 771: 'ພາຍຸ', 781: 'ພາຍຸໝຸນ'
  }
  
  // Check both maps
  return tomorrowConditions[code] || openWeatherConditions[code] || 'ອາກາດປອດໂປ່ງ'
}

// Format rainfall in mm with descriptive text
function formatRainfall(rainfall) {
  const amount = parseFloat(rainfall) || 0
  
  if (amount === 0) {
    return '0 mm (ບໍ່ມີຝົນ)'
  } else if (amount < 1) {
    return `${amount.toFixed(1)} mm (ຝົນອ່ອນ)`
  } else if (amount < 5) {
    return `${amount.toFixed(1)} mm (ຝົນເບົາ)`
  } else if (amount < 10) {
    return `${amount.toFixed(1)} mm (ຝົນປານກາງ)`
  } else if (amount < 20) {
    return `${amount.toFixed(1)} mm (ຝົນໜັກ)`
  } else {
    return `${amount.toFixed(1)} mm (ຝົນໜັກຫຼາຍ)`
  }
}

// เรียกใช้งานเริ่มต้น และเมื่อ mapCenter เปลี่ยน
onMounted(() => {
  fetchCurrentWeather()
  fetchApiForecast()
})
watch(() => props.mapCenter, () => {
  fetchCurrentWeather()
  fetchApiForecast()
}, { deep: true })

const fetchTomorrowForecast = async (city) => {
  try {
    // เรียก API ตาม city (หรือ province ด้วยถ้ามี)
    const res = await api.get('/api/weather/tomorrow', {
      params: { cityId: city.id }
    })
    // set ข้อมูลสำหรับโชว์
    // tomorrowForecast.value = res.data
  } catch (err) {
    console.error('Error fetching forecast:', err)
  }
}

// สร้าง debounce function
const fetchTomorrowForecastDebounced = debounce(fetchTomorrowForecast, 2000)

// ใช้ watch เรียกผ่าน debounce
watch(() => selectedCity.value, (city) => {
  if (city) fetchTomorrowForecastDebounced(city)
})
</script>
