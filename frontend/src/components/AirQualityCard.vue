<template>
  <div class="bg-white rounded-xl shadow p-6 space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p class="mt-4 text-gray-600">ກຳລັງໂຫຼດຂໍ້ມູນຄຸນນະພາບອາກາດ...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-12">
      <svg class="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
      <p class="text-red-600 text-center">{{ error }}</p>
      <button @click="fetchAirQuality(17.97, 102.6)" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        ລອງໃໝ່
      </button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Summary Section -->
      <div class="flex flex-col md:flex-row md:items-center gap-6 border-b pb-6">
        <!-- AQI Value + Level -->
        <div class="flex flex-col items-center">
          <div class="flex items-center justify-center w-20 h-20 rounded-full border-4 border-gray-200">
            <span class="text-4xl font-bold text-yellow-500">{{ summary.aqi }}</span>
          </div>
          <div class="text-lg font-semibold mt-2">{{ summary.level }}</div>
        </div>
        <!-- Title + Description -->
        <div class="flex-1">
          <h2 class="text-xl font-bold mb-2">
            ຄຸນນະພາບອາກາດມື້ນີ້ <span class="text-gray-500">- {{ location }}</span>
          </h2>
          <div class="text-gray-600 mb-1">{{ summary.description }}</div>
          <div class="flex items-center gap-4 mt-2">
            <span class="font-semibold">ມົນລະພິດຫຼັກ:</span>
            <span class="text-gray-800">{{ summary.primary }}</span>
          </div>
        </div>
      </div>

      <!-- Pollutants Section -->
      <div>
        <h3 class="text-base font-bold mb-2">ມົນລະພິດທັງຫມົດ</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="p in pollutants" :key="p.name" class="flex items-center p-4 border rounded-lg gap-4">
            <!-- Circle AQI Value -->
            <div class="flex flex-col items-center w-16">
              <div class="flex items-center justify-center w-12 h-12 rounded-full border-4 border-gray-200">
                <span :class="'text-lg font-bold ' + p.levelColor">{{ p.aqi }}</span>
              </div>
              <div :class="'text-xs mt-1 ' + p.levelColor">{{ p.level }}</div>
            </div>
            <!-- Pollutant Details -->
            <div class="ml-3">
              <div class="font-semibold">{{ p.laoname }}</div>
              <div class="text-xs text-gray-500">{{ p.value }} µg/m³</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-xs text-gray-400 mt-2 space-y-2">
      <!-- Data Source -->
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 8v4m0 4h.01"></path>
        </svg>
        <span>ຂໍ້ມູນຈາກ: {{ summary.source || 'Multiple APIs' }}</span>
      </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../plugins/axios.js'

const location = ref("ກຳລັງໂຫຼດ...")
const isLoading = ref(true)
const error = ref(null)
const isUsingRealKeys = ref(false)
const summary = ref({
  aqi: 0,
  level: '',
  description: '',
  primary: ''
})
const pollutants = ref([])

// --- ຄຳອະທິບາຍ AQI ຕາມມາດຕະຖານສາກົນ
function getAQIDesc(aqi) {
  if (aqi <= 50) {
    return {
      level: "ດີ",
      color: "text-green-500",
      description: "ຄຸນນະພາບອາກາດດີ ປອດໄພສຳລັບທຸກຄົນ ສາມາດເຮັດກິດຈະກຳກາງແຈ້ງໄດ້ຕາມປົກກະຕິ"
    }
  } else if (aqi <= 100) {
    return {
      level: "ປານກາງ",
      color: "text-yellow-500",
      description: "ຄຸນນະພາບອາກາດພໍໃຊ້ໄດ້ ຄົນທີ່ມີຄວາມອ່ອນໄຫວຕໍ່ມົນລະພິດອາດມີຜົນກະທົບເລັກໜ້ອຍ"
    }
  } else if (aqi <= 150) {
    return {
      level: "ບໍ່ດີສຳລັບກຸ່ມສ່ຽງ",
      color: "text-orange-500",
      description: "ຄົນທີ່ມີພະຍາດຫົວໃຈ, ຫອບຫືດ, ເດັກນ້ອຍ ແລະ ຜູ້ສູງອາຍຸ ຄວນຫຼຸດຜ່ອນກິດຈະກຳກາງແຈ້ງ"
    }
  } else if (aqi <= 200) {
    return {
      level: "ບໍ່ດີຕໍ່ສຸຂະພາບ",
      color: "text-red-500",
      description: "ທຸກຄົນອາດມີຜົນກະທົບຕໍ່ສຸຂະພາບ ຄວນຫຼີກເວັ້ນກິດຈະກຳກາງແຈ້ງແລະການອອກກຳລັງກາຍ"
    }
  } else if (aqi <= 300) {
    return {
      level: "ອັນຕະລາຍຫຼາຍ",
      color: "text-purple-700",
      description: "ມີຄວາມສ່ຽງສູງຕໍ່ສຸຂະພາບທຸກຄົນ ຄວນຢູ່ໃນຫ້ອງແລະປິດປ່ອງຢ້ຽມ"
    }
  } else {
    return {
      level: "ອັນຕະລາຍຮ້າຍແຮງ",
      color: "text-red-900",
      description: "ສຸກເສີນສຳລັບສຸຂະພາບທຸກຄົນ ຫ້າມອອກນອກເຮືອນ ສົ່ງຜົນເສຍຢ່າງຮ້າຍແຮງ"
    }
  }
}

onMounted(() => {
    // ຂໍອະນຸຍາດ location ຈາກ browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          fetchAirQuality(lat, lon)
          reverseGeocode(lat, lon)
        },
        err => {
          console.warn('ຖືກປະຕິເສດການເຂົ້າເຖິງທີ່ຕັ້ງ, ໃຊ້ຕຳແໜ່ງເລີ່ມຕົ້ນ')
          fetchAirQuality(17.97, 102.6)
          location.value = "ວຽງຈັນ, ລາວ"
        }
      )
    } else {
      fetchAirQuality(17.97, 102.6)
      location.value = "ວຽງຈັນ, ລາວ"
    }
})

// ການຕັ້ງຄ່າສຳລັບ API keys (ປິດການໃຊ້ງານ API ທີ່ບໍ່ມີ key ຈິງ)
const API_CONFIG = {
  // 🔑 WAQI Token - ໃຊ້ຂໍ້ມູນຈາກສະຖານີລັດຖະບານຈິງ (ຄວາມແມ່ນຍຳສູງສຸດ)
  WAQI_TOKEN: '80b521830332489bbde5fbef4ca1a86c11d5157f', // ✅ ໃຊ້ token ຈິງແລ້ວ
  
  // 🔑 ປິດການໃຊ້ງານ API ທີ່ບໍ່ມີ key ຈິງ (ເພື່ອຫຼີກຫຼ່ຽງ error)
  OWM_APPID: null, // ປິດການໃຊ້ງານ OpenWeatherMap
  AIRVISUAL_KEY: null // ປິດການໃຊ້ງານ AirVisual
  
  // 💡 ຫາກຕ້ອງການໃຊ້ API ເພີ່ມເຕີມ ໃຫ້ໃສ່ key ຈິງ:
  // OWM_APPID: 'abcdef1234567890abcdef1234567890', // 🔗 ຂໍຟຣີ: https://openweathermap.org/api
  // AIRVISUAL_KEY: '12345678-1234-1234-1234-123456789012' // 🔗 ຂໍຟຣີ: https://www.iqair.com/air-pollution-data-api
}

// ດຶງຂໍ້ມູນຈາກ Multiple APIs ເພື່ອປຽບທຽບ
async function fetchAirQuality(lat, lon) {
  try {
    isLoading.value = true
    error.value = null
    
    // ກວດສອບວ່າ API keys ຖືກຕັ້ງຄ່າຫຼືບໍ່
    const hasWAQI = API_CONFIG.WAQI_TOKEN && !API_CONFIG.WAQI_TOKEN.includes('YOUR_')
    const hasOWM = API_CONFIG.OWM_APPID && !API_CONFIG.OWM_APPID.includes('YOUR_')
    const hasAirVisual = API_CONFIG.AIRVISUAL_KEY && !API_CONFIG.AIRVISUAL_KEY.includes('YOUR_')
    
    isUsingRealKeys.value = hasWAQI || hasOWM || hasAirVisual
    
    if (!isUsingRealKeys.value) {
      console.warn('⚠️ ໃຊ້ພຽງແຕ່ WAQI ແລະ Open-Meteo API (ບໍ່ຕ້ອງໃຊ້ keys ເພີ່ມເຕີມ)')
    } else {
      console.log('✅ ໃຊ້ API keys ຈິງ - ຂໍ້ມູນຈະແມ່ນຍຳສູງສຸດ')
      if (hasWAQI) console.log('🎯 WAQI Token: Active (ຂໍ້ມູນຈາກສະຖານີລັດຖະບານຈິງ)')
    }
    
    // ລອງໃຊ້ API ຫຼາຍແຫຼ່ງ (ພ້ອມກັນເພື່ອປຽບທຽບ)
    const apiResults = []
    
    // 1. ລອງ WAQI (World Air Quality Index) API ກ່ອນ
    if (hasWAQI) {
      try {
        const waqiUrl = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${API_CONFIG.WAQI_TOKEN}`
        const waqiResponse = await fetch(waqiUrl)
        const waqiData = await waqiResponse.json()
        
        if (waqiData.status === 'ok' && waqiData.data && waqiData.data.aqi > 0) {
          apiResults.push({
            source: 'WAQI (ສະຖານີຕິດຕາມຈິງ)',
            data: parseWAQIData(waqiData.data),
            reliability: 95 // ຄວາມເຊື່ອຖືໄດ້ສູງສຸດ
          })
          console.log('✅ WAQI API: ສຳເລັດ')
        }
      } catch (e) {
        console.warn('WAQI API ລົ້ມເຫຼວ:', e)
      }
    }
    
    // 2. ລອງ OpenWeatherMap AQI API (ຖ້າມີ key ຈິງ)
    if (hasOWM) {
      try {
        const owmUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_CONFIG.OWM_APPID}`
        const owmResponse = await fetch(owmUrl)
        const owmData = await owmResponse.json()
        
        if (owmData.list && owmData.list.length > 0) {
          apiResults.push({
            source: 'OpenWeatherMap (ຂໍ້ມູນທົ່ວໂລກ)',
            data: parseOpenWeatherData(owmData.list[0]),
            reliability: 85
          })
          console.log('✅ OpenWeatherMap API: ສຳເລັດ')
        }
      } catch (e) {
        console.warn('OpenWeatherMap API ລົ້ມເຫຼວ:', e)
      }
    }
    
    // 3. ລອງ AirVisual API (ຖ້າມີ key ຈິງ)
    if (hasAirVisual) {
      try {
        const airVisualUrl = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${API_CONFIG.AIRVISUAL_KEY}`
        const avResponse = await fetch(airVisualUrl)
        const avData = await avResponse.json()
        
        if (avData.status === 'success' && avData.data) {
          apiResults.push({
            source: 'AirVisual (ເຄືອຂ່າຍຕິດຕາມ IQAir)',
            data: parseAirVisualData(avData.data),
            reliability: 90
          })
          console.log('✅ AirVisual API: ສຳເລັດ')
        }
      } catch (e) {
        console.warn('AirVisual API ລົ້ມເຫຼວ:', e)
      }
    }
    
    // 4. ໃຊ້ Open-Meteo ເປັນ fallback (ບໍ່ຕ້ອງໃຊ້ API key)
    if (apiResults.length === 0) {
      console.log('🔄 ໃຊ້ Open-Meteo ແທນ (ບໍ່ຕ້ອງໃຊ້ API key)')
      try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,carbon_monoxide,ozone,nitrogen_dioxide,sulphur_dioxide&current_hour=true`
        const response = await fetch(url)
        const data = await response.json()
        
        apiResults.push({
          source: 'Open-Meteo (ຂໍ້ມູນດາວທຽມ + ແບບຈຳລອງ)',
          data: parseOpenMeteoData(data),
          reliability: 70
        })
        console.log('✅ Open-Meteo API: ສຳເລັດ')
      } catch (e) {
        console.error('Open-Meteo API ລົ້ມເຫຼວ:', e)
        throw new Error('ທຸກ air quality APIs ລົ້ມເຫຼວ')
      }
    }
    
    // ເລືອກຂໍ້ມູນທີ່ດີທີ່ສຸດ (ຄວາມເຊື່ອຖືໄດ້ສູງສຸດ)
    const bestResult = apiResults.sort((a, b) => b.reliability - a.reliability)[0]
    
    if (bestResult) {
      console.log('ໃຊ້ຂໍ້ມູນທີ່ມີທີ່ສຸດ:', bestResult)
      processAirQualityData(bestResult.data, bestResult.source)
    } else {
      throw new Error('ບໍ່ມີຂໍ້ມູນຄຸນນະພາບອາກາດຈາກແຫຼ່ງໃດ')
    }
    
    isLoading.value = false
  } catch (e) {
    console.error('ຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນຄຸນນະພາບອາກາດ:', e)
    error.value = "ການດຶງຂໍ້ມູນຄຸນນະພາບອາກາດບໍ່ສຳເລັດ"
    summary.value = {
      aqi: 0,
      level: "ບໍ່ມີຂໍ້ມູນ",
      description: "ກະລຸນາລອງໃໝ່ອີກຄັ້ງ",
      primary: "-"
    }
    isLoading.value = false
  }
}

// ປະມວນຜົນຂໍ້ມູນ OpenWeatherMap
function parseOpenWeatherData(data) {
  const components = data.components
  const mainAQI = data.main?.aqi || 0
  
  // ແປງ OpenWeatherMap AQI (1-5) ເປັນມາດຕະຖານ EPA AQI (0-500)
  const aqiMap = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 250 }
  const standardAQI = aqiMap[mainAQI] || 0
  
  return {
    mainAQI: standardAQI,
    pollutants: {
      'pm2_5': components?.pm2_5 || 0,
      'pm10': components?.pm10 || 0,
      'ozone': components?.o3 || 0,
      'carbon_monoxide': components?.co || 0,
      'nitrogen_dioxide': components?.no2 || 0,
      'sulphur_dioxide': components?.so2 || 0
    },
    source: 'OpenWeatherMap (ຂໍ້ມູນທົ່ວໂລກ)'
  }
}

// ປະມວນຜົນຂໍ້ມູນ WAQI
function parseWAQIData(data) {
  return {
    mainAQI: data.aqi || 0,
    pollutants: {
      'pm2_5': data.iaqi?.pm25?.v || 0,
      'pm10': data.iaqi?.pm10?.v || 0,
      'ozone': data.iaqi?.o3?.v || 0,
      'carbon_monoxide': data.iaqi?.co?.v || 0,
      'nitrogen_dioxide': data.iaqi?.no2?.v || 0,
      'sulphur_dioxide': data.iaqi?.so2?.v || 0
    },
    source: 'WAQI (ສະຖານີຕິດຕາມຈິງ)'
  }
}

// ປະມວນຜົນຂໍ້ມູນ AirVisual
function parseAirVisualData(data) {
  const current = data.current
  return {
    mainAQI: current.pollution?.aqius || 0,
    pollutants: {
      'pm2_5': current.pollution?.p2?.v || 0,
      'pm10': current.pollution?.p1?.v || 0,
      'ozone': 0, // AirVisual ບໍ່ໃຫ້ມົນລະພິດອື່ນໃນຊຸດຟຣີ
      'carbon_monoxide': 0,
      'nitrogen_dioxide': 0,
      'sulphur_dioxide': 0
    },
    source: 'AirVisual (ເຄືອຂ່າຍຕິດຕາມ IQAir)'
  }
}

// ປະມວນຜົນຂໍ້ມູນ Open-Meteo
function parseOpenMeteoData(data) {
  const idx = 0
  const values = {
    'pm2_5': data.hourly?.pm2_5?.[idx] || 0,
    'pm10': data.hourly?.pm10?.[idx] || 0,
    'ozone': data.hourly?.ozone?.[idx] || 0,
    'carbon_monoxide': data.hourly?.carbon_monoxide?.[idx] || 0,
    'nitrogen_dioxide': data.hourly?.nitrogen_dioxide?.[idx] || 0,
    'sulphur_dioxide': data.hourly?.sulphur_dioxide?.[idx] || 0
  }
  
  // ຄຳນວນ AQI ຈາກຄ່າ concentration
  const aqiValues = Object.entries(values).map(([name, value]) => getAQI(name, value))
  const mainAQI = Math.max(...aqiValues)
  
  return {
    mainAQI,
    pollutants: values,
    source: 'Open-Meteo (ຂໍ້ມູນດາວທຽມ + ແບບຈຳລອງ)'
  }
}

// ປະມວນຜົນຂໍ້ມູນສຸດທ້າຍ
function processAirQualityData(airData, dataSource) {
  const dataLao = [
    { name: 'pm2_5', laoname: 'ຝຸ່ນ PM2.5' },
    { name: 'pm10', laoname: 'ຝຸ່ນ PM10' },
    { name: 'ozone', laoname: 'ໂອໂຊນ (O₃)' },
    { name: 'carbon_monoxide', laoname: 'ຄາບອນມອນອອກໄຊ (CO)' },
    { name: 'nitrogen_dioxide', laoname: 'ໄນໂຕຣເຈນໄດອອກໄຊ (NO₂)' },
    { name: 'sulphur_dioxide', laoname: 'ຊົວເຟີໄດອອກໄຊ (SO₂)' }
  ]

  pollutants.value = dataLao.map((item) => {
    const value = airData.pollutants[item.name] || 0
    const aqiValue = dataSource?.includes('WAQI') || dataSource?.includes('AirVisual') 
      ? value // API ເຫລົ່ານີ້ສົ່ງ AQI ມາແລ້ວ
      : getAQI(item.name, value) // ຄຳນວນ AQI ເອງ
    
    const desc = getAQIDesc(aqiValue)
    return {
      ...item,
      aqi: aqiValue,
      level: desc.level,
      value: value.toFixed(2),
      levelColor: desc.color
    }
  }).filter(p => p.aqi > 0) // ເອົາພຽງແຕ່ທີ່ມີຂໍ້ມູນ

  // ໃຊ້ AQI ຫຼັກຈາກ API ຫຼືຫາຄ່າສູງສຸດ
  const mainAQI = airData.mainAQI || Math.max(...pollutants.value.map(p => p.aqi))
  const main = pollutants.value.find(p => p.aqi === mainAQI) || pollutants.value[0]
  
  const desc = getAQIDesc(mainAQI)
  summary.value = {
    aqi: mainAQI,
    level: desc.level,
    description: desc.description,
    primary: main?.laoname || 'ບໍ່ມີຂໍ້ມູນ',
    source: dataSource || airData.source
  }
}

// ປັບປຸງຟັງຊັນຄຳນວນ AQI ໃຫ້ຖືກຕ້ອງຕາມມາດຕະຖານ EPA
function getAQI(name, value) {
  if (!value || value < 0) return 0
  
  switch(name) {
    case 'pm2_5':
      if (value <= 12) return Math.round(value * 50 / 12)
      if (value <= 35.4) return Math.round(50 + (value - 12) * 50 / 23.4)
      if (value <= 55.4) return Math.round(100 + (value - 35.4) * 50 / 20)
      if (value <= 150.4) return Math.round(150 + (value - 55.4) * 50 / 95)
      return Math.min(300, Math.round(200 + (value - 150.4) * 100 / 149.6))
    
    case 'pm10':
      if (value <= 54) return Math.round(value * 50 / 54)
      if (value <= 154) return Math.round(50 + (value - 54) * 50 / 100)
      if (value <= 254) return Math.round(100 + (value - 154) * 50 / 100)
      return Math.min(300, Math.round(150 + (value - 254) * 150 / 246))
    
    case 'ozone':
      if (value <= 54) return Math.round(value * 50 / 54)
      if (value <= 70) return Math.round(50 + (value - 54) * 50 / 16)
      if (value <= 85) return Math.round(100 + (value - 70) * 50 / 15)
      return Math.min(200, Math.round(150 + (value - 85) * 50 / 20))
    
    case 'carbon_monoxide':
      if (value <= 4.4) return Math.round(value * 50 / 4.4)
      if (value <= 9.4) return Math.round(50 + (value - 4.4) * 50 / 5)
      if (value <= 12.4) return Math.round(100 + (value - 9.4) * 50 / 3)
      return Math.min(200, Math.round(150 + (value - 12.4) * 50 / 2.6))
    
    case 'nitrogen_dioxide':
      if (value <= 53) return Math.round(value * 50 / 53)
      if (value <= 100) return Math.round(50 + (value - 53) * 50 / 47)
      if (value <= 360) return Math.round(100 + (value - 100) * 50 / 260)
      return Math.min(200, Math.round(150 + (value - 360) * 50 / 289))
    
    case 'sulphur_dioxide':
      if (value <= 35) return Math.round(value * 50 / 35)
      if (value <= 75) return Math.round(50 + (value - 35) * 50 / 40)
      if (value <= 185) return Math.round(100 + (value - 75) * 50 / 110)
      return Math.min(200, Math.round(150 + (value - 185) * 50 / 119))
    
    default:
      return 0
  }
}

async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=lo,en`
    const { data } = await api.get(url)
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || ""
    const country = data.address?.country || ""
    location.value = city && country ? `${city}, ${country}` : `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  } catch (e) {
    console.warn('ການຫາທີ່ຕັ້ງແບບກັບກັນລົ້ມເຫຼວ:', e)
    location.value = `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  }
}
</script>
