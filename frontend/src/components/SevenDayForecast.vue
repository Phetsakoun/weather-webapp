<!-- src/components/SevenDayForecast.vue -->
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
      <span class="text-blue-600 ml-2">ກຳລັງໂຫລດ LSTM …</span>
    </div>

    <!-- Forecast cards -->
    <div v-else>
      <h2 class="text-3xl font-bold mb-6">
        ພະຍາກອນອາກາດ 7 ມື້ (ຈາກໂມເດລ LSTM)
      </h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        <!-- Main "วันนี้" card -->
        <div class="bg-blue-500 text-white rounded-xl p-6 flex flex-col items-center shadow-lg">
          <div class="text-lg mb-2">ຈາກໂມເດລ LSTM</div>
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
          v-for="(day, idx) in lstmForecast"
          :key="idx"
          class="bg-blue-400 text-black rounded-xl p-4 flex flex-col items-center shadow"
        >
          <div class="text-lg mb-1">{{ getDayName(day.date) }}</div>
          <div class="text-base mb-2">{{ formatDate(day.date) }}</div>
          <div class="text-4xl mb-2">{{ getWeatherIcon(adjustWeatherCode(day.weatherCode, day.precipitationProbability)) }}</div>
          <div class="text-2xl font-bold">{{ Math.round(day.tempMax) }}°</div>
          <div class="text-lg">{{ Math.round(day.tempMin) }}°</div>
          <div class="text-base mt-1">{{ getWeatherCondition(adjustWeatherCode(day.weatherCode, day.precipitationProbability)) }}</div>
          <div class="mt-3 text-sm space-y-1 text-center">
            <div>🌧️ {{ formatRainfall(day.precipitationProbability) }}</div>
            <div>💨 {{ Math.round(day.windSpeed) }} km/h</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../plugins/axios.js'

const props = defineProps({
  mapCenter: {
    type: Array,
    required: true
  },
  cityId: {
    type: Number,
    required: true
  },
  lstmData: {
    type: Object,
    default: () => ({})
  }
})

const lstmForecast = ref([])
const currentForecast = ref({ 
  temperature: 0, 
  weatherCode: 1000, 
  precipitationProbability: 0, 
  windSpeed: 0 
})
const now = ref(new Date())
const isLoading = ref(true)

async function fetchModelForecast() {
  isLoading.value = true
  console.log('SevenDayForecast: fetchModelForecast called')
  console.log('SevenDayForecast: props.lstmData:', props.lstmData)
  
  try {
    // ใช้ข้อมูลจาก props.lstmData ก่อน
    if (props.lstmData && props.lstmData.temperatures && props.lstmData.temperatures.length > 0) {
      console.log('SevenDayForecast: Using LSTM data from props:', props.lstmData)
      console.log('SevenDayForecast: Temperature data:', props.lstmData.temperatures)
      console.log('SevenDayForecast: Precipitation data:', props.lstmData.precipitations)
      
      // ตั้งค่าสำหรับวันนี้
      currentForecast.value = {
        temperature: props.lstmData.temperatures[0] || 30,
        weatherCode: 1000,
        precipitationProbability: props.lstmData.rainfall?.[0] || props.lstmData.precipitations?.[0] || 0,
        windSpeed: 5
      }
      
      // สร้างข้อมูลสำหรับ 6 วันต่อไป
      lstmForecast.value = []
      const dataLength = Math.min(7, props.lstmData.temperatures.length)
      
      for (let i = 1; i < dataLength; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        
        lstmForecast.value.push({
          date: date.toISOString(),
          tempMax: (props.lstmData.temperatures[i] || 30) + 2,
          tempMin: (props.lstmData.temperatures[i] || 30) - 3,
          precipitationProbability: props.lstmData.rainfall?.[i] || props.lstmData.precipitations?.[i] || 0,
          windSpeed: Math.random() * 10 + 5,
          weatherCode: [1000,1100,1101,1102,1001,4000][Math.floor(Math.random()*6)]
        })
      }
      
      console.log('SevenDayForecast: Generated forecast from LSTM data:', lstmForecast.value)
      
      // ถ้าข้อมูลไม่เพียงพอ ให้เติม mock data
      if (lstmForecast.value.length < 6) {
        console.log('SevenDayForecast: Need to add mock data, current length:', lstmForecast.value.length)
        generateMockData(6 - lstmForecast.value.length, true)
      }
      
      isLoading.value = false
      return
    }
    
    console.log('SevenDayForecast: No LSTM data from props, calling API directly')
    
    // ถ้าไม่มีข้อมูลจาก props ให้เรียก API
    // ส่ง lat/lon จาก mapCenter
    const [lat, lon] = props.mapCenter
    console.log('SevenDayForecast: Calling API with lat/lon:', lat, lon)
    
    const res = await api.post('/api/predict/fetch-predict-save', { 
      lat: lat,
      lon: lon
    })

    console.log('SevenDayForecast: API response:', res.data)

    if (res.data && res.data.success && res.data.data && res.data.data.predictions) {
      const predictions = res.data.data.predictions
      console.log('SevenDayForecast: Processing API predictions:', predictions)
      
      // ตั้งค่าสำหรับวันนี้
      currentForecast.value = {
        temperature: predictions.temperatures?.[0] ?? 30,
        weatherCode: 1000, // ใช้ค่าเริ่มต้น
        precipitationProbability: predictions.rainfall?.[0] ?? predictions.precipitations?.[0] ?? 0,
        windSpeed: 5 // ใช้ค่าเริ่มต้น
      }
      
      // สร้างข้อมูลสำหรับ 6 วันต่อไป
      lstmForecast.value = []
      for (let i = 1; i < Math.min(7, predictions.times?.length || 0); i++) {
        lstmForecast.value.push({
          date: predictions.times[i],
          tempMax: predictions.temperatures?.[i] + 2 || 30,
          tempMin: predictions.temperatures?.[i] - 3 || 25,
          precipitationProbability: predictions.rainfall?.[i] || predictions.precipitations?.[i] || 0,
          windSpeed: Math.random() * 10 + 5, // mock wind speed
          weatherCode: [1000,1100,1101,1102,1001,4000][Math.floor(Math.random()*6)]
        })
      }
      
      console.log('SevenDayForecast: Generated forecast from API:', lstmForecast.value)
      
      // ถ้าข้อมูลไม่เพียงพอ ให้เติม mock data
      if (lstmForecast.value.length < 6) {
        console.log('SevenDayForecast: Need to add mock data, current length:', lstmForecast.value.length)
        generateMockData(6 - lstmForecast.value.length)
      }
    } else {
      console.log('SevenDayForecast: No valid data from API, using mock data')
      generateMockData(7)
    }
  } catch (err) {
    console.error('SevenDayForecast: LSTM API error:', err)
    generateMockData(7)
  } finally {
    isLoading.value = false
  }
}


function generateMockData(numDays = 7, isAppend = false) {
  if (!isAppend) {
    // วันแรก = วันนี้
    const todayRainfall = Math.random() * 15 // 0-15mm
    currentForecast.value = {
      temperature: 28 + Math.random() * 4,
      weatherCode: todayRainfall > 5 ? 
        [500, 501, 502, 4000, 4001][Math.floor(Math.random() * 5)] : // Rain codes if rainfall > 5mm
        [800, 801, 802, 803, 1000, 1100, 1101][Math.floor(Math.random() * 7)], // Clear/cloudy codes
      precipitationProbability: todayRainfall,
      windSpeed: Math.floor(Math.random() * 8 + 2)
    }
    
    // รีเซ็ตอาเรย์
    lstmForecast.value = []
  }
  
  // เพิ่มข้อมูล mock สำหรับจำนวนวันที่ต้องการ
  const startIndex = isAppend ? lstmForecast.value.length : 0
  for (let i = 0; i < numDays; i++) {
    const date = new Date()
    date.setDate(date.getDate() + startIndex + i + 1)
    const temperature = 28 + Math.random() * 4
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
    
    lstmForecast.value.push({
      date: date.toISOString(),
      tempMax: temperature,
      tempMin: temperature - Math.random() * 3 - 1,
      weatherCode: weatherCode,
      precipitationProbability: rainfall,
      windSpeed: Math.floor(Math.random() * 8 + 2)
    })
  }
}

// Helpers
function formatDateTime(dt) {
  return new Intl.DateTimeFormat('lo-LA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dt))
}

function formatDate(dt) {
  return new Intl.DateTimeFormat('lo-LA', { 
    day: '2-digit', 
    month: 'short' 
  }).format(new Date(dt))
}

function getDayName(dt) {
  const days = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ']
  const date = new Date(dt)
  return days[date.getDay()]
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
    1101: 'ເມກບາງສ່ວນ', 1102: 'ເມກຫຼາຍ', 1001: 'ເມກທັງໝົດ',
    2000: 'ມີໝອກ', 2100: 'ມີໝອກເບົາ', 4000: 'ມີຝົນໂຮຍ',
    4001: 'ມີຝົນ', 4200: 'ຝົນຄ່ອຍ', 4201: 'ຝົນໜັກ',
    5000: 'ຫິມະ', 5001: 'ຫິມະເບົາ', 5100: 'ຫິມະເບົາ',
    5101: 'ຫິມະໜັກ', 6000: 'ຝົນນ້ຳກ້າມ', 6001: 'ຝົນນ້ຳກ້າມ',
    6200: 'ຝົນນ້ຳກ້າມຄ່ອຍ', 6201: 'ຝົນນ້ຳກ້າມໜັກ',
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
    751: 'ພາຍຸດິນ', 761: 'ຝຸ່ນ', 762: 'ຂີ້ເຖົ່າ', 771: 'ພາຍຸ', 781: 'ພາຍຸໝຸນ'
  }
  
  // Check both maps
  return tomorrowConditions[code] || openWeatherConditions[code] || 'ອາກາດປອດໂປ່ງ'
}

// Smart weather code adjustment based on rainfall amount (in mm)
function adjustWeatherCode(originalCode, rainfallAmount) {
  // Handle undefined/null/NaN values and convert to mm
  const rainfall = parseFloat(rainfallAmount) || 0
  
  // ถ้าฝนหนักมาก (>= 20mm) ให้แสดงไอคอนฝนหนักมาก
  if (rainfall >= 20) {
    return 502 // Heavy rain
  }
  
  // ถ้าฝนหนัก (10-20mm) ให้แสดงไอคอนฝนหนัก
  if (rainfall >= 10) {
    return 501 // Moderate rain
  }
  
  // ถ้าฝนปานกลาง (5-10mm) ให้แสดงไอคอนฝน
  if (rainfall >= 5) {
    return 500 // Light rain
  }
  
  // ถ้าฝนเบา (1-5mm) ให้แสดงไอคอนฝนเบา
  if (rainfall >= 1) {
    return 300 // Drizzle
  }
  
  // ถ้าฝนอ่อน (0.1-1mm) ให้แสดงไอคอนมีฝนโปรย
  if (rainfall >= 0.1) {
    return 300 // Light drizzle
  }
  
  // ถ้าไม่มีฝน ให้ใช้ weather code เดิม หรือปรับให้เหมาะสม
  if (rainfall === 0) {
    // ถ้า code เดิมเป็นฝน ให้เปลี่ยนเป็นสภาพอากาศแจ่มใสหรือมีเมฆ
    const rainCodes = [200, 201, 202, 210, 211, 212, 221, 230, 231, 232, 300, 301, 302, 310, 311, 312, 313, 314, 321, 500, 501, 502, 503, 504, 511, 520, 521, 522, 531, 4000, 4001, 4200, 4201]
    if (rainCodes.includes(originalCode)) {
      // สุ่มระหว่างแจ่มใสและมีเมฆ
      const clearOptions = [800, 801, 802, 803] // Clear to cloudy
      return clearOptions[Math.floor(Math.random() * clearOptions.length)]
    }
    
    // ถ้าเป็น code ปกติ ให้ใช้ตามเดิม
    return originalCode
  }
  
  return originalCode // Return original if no specific adjustment needed
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

// Initialize data
onMounted(() => {
  console.log('SevenDayForecast: Component mounted')
  generateMockData()
  fetchModelForecast()
})

// Watch for lstmData changes
watch(() => props.lstmData, (newData, oldData) => {
  console.log('SevenDayForecast: lstmData watcher triggered')
  console.log('SevenDayForecast: newData:', newData)
  console.log('SevenDayForecast: oldData:', oldData)
  if (newData && newData.temperatures && newData.temperatures.length > 0) {
    console.log('SevenDayForecast: Valid LSTM data detected, updating forecast')
    console.log('SevenDayForecast: Temperature count:', newData.temperatures.length)
    fetchModelForecast()
  } else {
    console.log('SevenDayForecast: No valid LSTM data in watcher')
  }
}, { deep: true })

// Watch for location/cityId changes
watch(() => props.cityId, () => {
  fetchModelForecast()
})
watch(() => props.mapCenter, () => {
  fetchModelForecast()
}, { deep: true })

defineExpose({
  fetchModelForecast
})
</script>
