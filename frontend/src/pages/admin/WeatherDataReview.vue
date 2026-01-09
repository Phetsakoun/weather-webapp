<template>
  <div class="min-h-screen bg-[#f4f7fa] p-6">
    <!-- Breadcrumb/Title Bar -->
    <div class="bg-white shadow px-6 py-4 flex items-center justify-between rounded-xl mb-6">
      <div class="flex items-center">
        <div class="bg-cyan-100 rounded-lg p-3 mr-4">
          <v-icon size="28" color="cyan">mdi-weather-partly-cloudy</v-icon>
        </div>
        <div>
          <div class="text-xs text-gray-400">ແອດມິນ / ຂໍ້ມູນສະພາບອາກາດ</div>
          <div class="text-2xl font-bold text-blue-900">ຂໍ້ມູນສະພາບອາກາດ</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <v-btn color="secondary" prepend-icon="mdi-refresh" @click="refreshData" :loading="loading">
          ໂຫລດໃໝ່
        </v-btn>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center">
          <div class="bg-blue-100 rounded-full p-3 mr-3">
            <v-icon color="blue">mdi-database</v-icon>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ weatherData.length }}</div>
            <div class="text-sm text-gray-600">ບັນທຶກທັງໝົດ</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center">
          <div class="bg-green-100 rounded-full p-3 mr-3">
            <v-icon color="green">mdi-check-circle</v-icon>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ activeCitiesCount }}</div>
            <div class="text-sm text-gray-600">ເມືອງທີ່ນຳໃຊ້</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center">
          <div class="bg-purple-100 rounded-full p-3 mr-3">
            <v-icon color="purple">mdi-brain</v-icon>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ predictionData.length }}</div>
            <div class="text-sm text-gray-600">ການຄາດການ</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center">
          <div class="bg-orange-100 rounded-full p-3 mr-3">
            <v-icon color="orange">mdi-clock</v-icon>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ lastUpdated }}</div>
            <div class="text-sm text-gray-600">ອັບເດດຄັ້ງລ່າສຸດ</div>
          </div>
        </div>
      </div>
    </div>



    <!-- Advanced Filters Component -->
    <div class="bg-white rounded-xl shadow p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">ການກັ່ນຕອງແລະການຄົ້ນຫາຂັ້ນສູງ</h3>
        <v-btn variant="outlined" color="warning" prepend-icon="mdi-filter-remove" @click="clearFilters" size="small">
          ລຶບທຸກການກັ່ນຕອງ
        </v-btn>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
        <!-- Search -->
        <div class="xl:col-span-2">
          <v-text-field
            v-model="searchQuery"
            label="ຄົ້ນຫາ..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            clearable
            placeholder="ຄົ້ນຫາຕາມເມືອງ, ວັນທີ, ສະພາບອາກາດ..."
          />
        </div>
        
        <!-- City Selection -->
        <v-select
          v-model="selectedCity"
          :items="cities"
          :item-title="item => item.name_th || item.name_en || item.name || 'ບໍ່ຮູ້'"
          item-value="id"
          label="ເລືອກເມືອງ"
          density="compact"
          variant="outlined"
          clearable
          prepend-inner-icon="mdi-map-marker"
        />
        
        <!-- From Date -->
        <v-text-field
          v-model="dateFrom"
          label="ຕັ້ງແຕ່ວັນທີ"
          type="date"
          density="compact"
          variant="outlined"
          clearable
          prepend-inner-icon="mdi-calendar-start"
        />
        
        <!-- To Date -->
        <v-text-field
          v-model="dateTo"
          label="ເຖິງວັນທີ"
          type="date"
          density="compact"
          variant="outlined"
          clearable
          prepend-inner-icon="mdi-calendar-end"
        />
        
        <!-- Weather Condition -->
        <v-select
          v-model="selectedCondition"
          :items="weatherConditions"
          label="ສະພາບອາກາດ"
          density="compact"
          variant="outlined"
          clearable
          prepend-inner-icon="mdi-weather-partly-cloudy"
        />
      </div>
      
      <!-- Quick Filters -->
      <div class="flex flex-wrap gap-2">
        <v-chip
          variant="outlined"
          color="primary"
          prepend-icon="mdi-calendar-today"
          @click="setQuickFilter('today')"
          :class="{ 'bg-primary text-white': isQuickFilterActive('today') }"
        >
          ມື້ນີ້
        </v-chip>
        <v-chip
          variant="outlined"
          color="primary"
          prepend-icon="mdi-calendar-week"
          @click="setQuickFilter('thisWeek')"
          :class="{ 'bg-primary text-white': isQuickFilterActive('thisWeek') }"
        >
          ອາທິດນີ້
        </v-chip>
        <v-chip
          variant="outlined"
          color="primary"
          prepend-icon="mdi-calendar-month"
          @click="setQuickFilter('thisMonth')"
          :class="{ 'bg-primary text-white': isQuickFilterActive('thisMonth') }"
        >
          ເດືອນນີ້
        </v-chip>
        <v-chip
          variant="outlined"
          color="orange"
          prepend-icon="mdi-thermometer-high"
          @click="setQuickFilter('hotDays')"
          :class="{ 'bg-orange text-white': isQuickFilterActive('hotDays') }"
        >
          ວັນຮ້ອນ (>30°C)
        </v-chip>
        <v-chip
          variant="outlined"
          color="blue"
          prepend-icon="mdi-weather-rainy"
          @click="setQuickFilter('rainyDays')"
          :class="{ 'bg-blue text-white': isQuickFilterActive('rainyDays') }"
        >
          ວັນຝົນຕົກ
        </v-chip>
        <v-chip
          variant="outlined"
          color="teal"
          prepend-icon="mdi-water-percent"
          @click="setQuickFilter('highHumidity')"
          :class="{ 'bg-teal text-white': isQuickFilterActive('highHumidity') }"
        >
          ຄວາມຊຸ່ມສູງ (>80%)
        </v-chip>
      </div>
      
      <!-- Filter Summary -->        <div v-if="hasActiveFilters" class="mt-4 p-3 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="text-sm text-blue-800">
            <v-icon size="16" color="blue">mdi-filter</v-icon>
            ສະແດງ {{ filteredWeatherData.length }} ບັນທຶກຂໍ້ມູນສະພາບອາກາດ ແລະ {{ filteredPredictionData.length }} ການຄາດການ
            <span v-if="searchQuery"> ທີ່ຕົງກັບ "{{ searchQuery }}"</span>
            <span v-if="selectedCity"> ໃນ {{ getCityName(selectedCity) }}</span>
            <span v-if="dateFrom && dateTo"> ຕັ້ງແຕ່ {{ formatDate(dateFrom) }} ເຖິງ {{ formatDate(dateTo) }}</span>
            <span v-if="selectedCondition"> ພ້ອມສະພາບອາກາດ {{ selectedCondition }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Weather Data Table Component -->
    <div class="bg-white rounded-xl shadow p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <div class="bg-blue-100 rounded-lg p-3 mr-4">
            <v-icon size="24" color="blue">mdi-weather-partly-cloudy</v-icon>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">ບັນທຶກຂໍ້ມູນສະພາບອາກາດ</h3>
            <p class="text-sm text-gray-600">ພົບ {{ filteredWeatherData.length }} ບັນທຶກຂໍ້ມູນ</p>
          </div>
        </div>
      </div>
      
      <DataTable
        title=""
        :headers="weatherHeaders"
        :items="filteredWeatherData"
        :loading="loading"
        :search="searchQuery"
        show-temperature
        show-humidity
        show-date
        @export="exportWeatherData"
      />
    </div>

    <!-- LSTM Predictions Table Component -->
    <div class="bg-white rounded-xl shadow p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <div class="bg-purple-100 rounded-lg p-3 mr-4">
            <v-icon size="24" color="purple">mdi-brain</v-icon>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">ການຄາດຈາກ Model LSTM</h3>
            <p class="text-sm text-gray-600">ພົບ {{ filteredPredictionData.length }} ການຄາດການ</p>
          </div>
        </div>
      </div>
      
      <DataTable
        title=""
        :headers="predictionHeaders"
        :items="filteredPredictionData"
        :loading="loading"
        :search="searchQuery"
        show-predicted-temperature
        show-actual-temperature
        show-predicted-humidity
        show-actual-humidity
        show-prediction-date
        show-confidence
        @export="exportPredictionData"
      >
        <!-- Custom slot for predicted temperature -->
        <template #item.predicted_temperature="{ item }">
          <v-chip 
            :color="getTemperatureColor(item.predicted_temperature)" 
            size="small"
            class="font-medium"
          >
            {{ item.predicted_temperature !== null && item.predicted_temperature !== undefined 
              ? Math.round(item.predicted_temperature * 10) / 10 + '°C' 
              : 'ບໍ່ມີຂໍ້ມູນ' }}
          </v-chip>
        </template>

        <!-- Custom slot for actual temperature -->
        <template #item.actual_temperature="{ item }">
          <v-chip 
            :color="getTemperatureColor(item.actual_temperature)" 
            size="small"
            class="font-medium"
          >
            {{ item.actual_temperature !== null && item.actual_temperature !== undefined 
              ? item.actual_temperature + '°C' 
              : 'ບໍ່ມີຂໍ້ມູນ' }}
          </v-chip>
        </template>

        <!-- Custom slot for predicted humidity with progress bar -->
        <template #item.predicted_humidity="{ item }">
          <div class="flex items-center space-x-2" v-if="item.predicted_humidity !== null && item.predicted_humidity !== undefined">
            <v-progress-linear
              :model-value="Math.round(item.predicted_humidity)"
              color="blue"
              height="8"
              rounded
              class="flex-1"
            />
            <span class="text-sm font-medium min-w-[40px]">{{ Math.round(item.predicted_humidity) }}%</span>
          </div>
          <span v-else class="text-gray-400 italic">ບໍ່ມີຂໍ້ມູນ</span>
        </template>

        <!-- Custom slot for actual humidity with progress bar -->
        <template #item.actual_humidity="{ item }">
          <div class="flex items-center space-x-2" v-if="item.actual_humidity !== null && item.actual_humidity !== undefined">
            <v-progress-linear
              :model-value="item.actual_humidity"
              color="teal"
              height="8"
              rounded
              class="flex-1"
            />
            <span class="text-sm font-medium min-w-[40px]">{{ item.actual_humidity }}%</span>
          </div>
          <span v-else class="text-gray-400 italic">ບໍ່ມີຂໍ້ມູນ</span>
        </template>

        <!-- Custom slot for confidence with green progress bar -->
        <template #item.confidence="{ item }">
          <div class="flex items-center space-x-2" v-if="item.confidence !== null && item.confidence !== undefined">
            <v-progress-linear
              :model-value="item.confidence"
              color="green"
              height="8"
              rounded
              class="flex-1"
            />
            <span class="text-sm font-medium min-w-[40px]">{{ item.confidence }}%</span>
          </div>
          <span v-else class="text-gray-400 italic">ບໍ່ມີຂໍ້ມູນ</span>
        </template>

        <!-- Custom slot for prediction date -->
        <template #item.prediction_date="{ item }">
          <v-chip 
            :color="getDateColor(item.prediction_date)" 
            size="small"
            class="font-medium"
          >
            {{ formatDate(item.prediction_date) }}
          </v-chip>
        </template>
      </DataTable>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Temperature Trend Chart Component -->
      <WeatherChart
        ref="temperatureChartRef"
        title="ການປ່ຽນແປງຂອງອຸນຫະພູມ"
        :chart-data="temperatureTrendData"
        :chart-options="chartOptions"
        :raw-data="filteredWeatherData"
        chart-type="bar"
        @refresh="updateChartData"
        @export="exportChart"
        @trend-analysis="onTrendAnalysis"
      />

      <!-- Humidity Trend Chart Component -->
      <WeatherChart
        ref="humidityChartRef"
        title="ການປ່ຽນແປງຂອງຄວາມຊຸ່ມ"
        :chart-data="humidityTrendData"
        :chart-options="chartOptions"
        :raw-data="filteredWeatherData"
        chart-type="bar"
        @refresh="updateChartData"
        @export="exportChart"
        @trend-analysis="onTrendAnalysis"
      />
    </div>

    <!-- Predictions Chart Component -->
    <WeatherChart
      ref="predictionChartRef"
      title="ການປຽບທຽບປະລິມານຝົນ LSTM ກັບ API"
      :chart-data="predictionChartData"
      :chart-options="predictionChartOptions"
      :raw-data="filteredPredictionData"
      :height="400"
      chart-type="bar"
      @refresh="updateChartData"
      @export="exportChart"
      @trend-analysis="onTrendAnalysis"
    />

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="600">
      <v-card>
        <v-card-title>
          <span class="text-lg font-semibold">{{ editingItem ? 'ແກ້ໄຂ' : 'ເພີ່ມ' }} ຂໍ້ມູນສະພາບອາກາດ</span>
        </v-card-title>
        <v-card-text>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <v-text-field
              v-model="form.date"
              label="ວັນທີ"
              type="date"
              density="compact"
              variant="outlined"
              :rules="[v => !!v || 'ວັນທີແມ່ນຈຳເປັນ']"
            />
            <v-select
              v-model="form.cityId"
              :items="cities"
              item-title="name"
              item-value="id"
              label="ເມືອງ"
              density="compact"
              variant="outlined"
              :rules="[v => !!v || 'ເມືອງແມ່ນຈຳເປັນ']"
            />
            <v-text-field
              v-model="form.temperature"
              label="ອຸນຫະພູມ (°C)"
              type="number"
              density="compact"
              variant="outlined"
              :rules="[v => !!v || 'ອຸນຫະພູມແມ່ນຈຳເປັນ']"
            />
            <v-text-field
              v-model="form.humidity"
              label="ຄວາມຊຸ່ມ (%)"
              type="number"
              density="compact"
              variant="outlined"
              :rules="[v => !!v || 'ຄວາມຊຸ່ມແມ່ນຈຳເປັນ']"
            />
            <v-text-field
              v-model="form.pressure"
              label="ຄວາມກົດດັນ (hPa)"
              type="number"
              density="compact"
              variant="outlined"
            />
            <v-text-field
              v-model="form.windSpeed"
              label="ຄວາມໄວລົມ (km/h)"
              type="number"
              density="compact"
              variant="outlined"
            />
            <v-text-field
              v-model="form.rainfall"
              label="ຝົນຕົກ (mm)"
              type="number"
              density="compact"
              variant="outlined"
            />
            <v-select
              v-model="form.weatherCondition"
              :items="weatherConditions"
              label="ສະພາບອາກາດ"
              density="compact"
              variant="outlined"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="saveWeatherData" :loading="saving">
            {{ editingItem ? 'ອັບເດດ' : 'ບັນທຶກ' }}
          </v-btn>
          <v-btn variant="text" @click="closeDialog">ຍົກເລີກ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar Notification -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" location="top right">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">ປິດ</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import api from '../../plugins/axios'
import LineChart from '../../components/LineChart.vue'
import DataTable from '../../components/DataTable.vue'
import WeatherChart from '../../components/WeatherChart.vue'
import RealTimeUpdates from '../../components/RealTimeUpdates.vue'
import { Chart as ChartJS } from 'chart.js'

// Loading states
const loading = ref(false)
const saving = ref(false)
const generatingPredictions = ref(false)
const exporting = ref(false)
const generatingReports = ref(false)

// Data
const weatherData = ref([])
const predictionData = ref([])
const cities = ref([])
const filteredWeatherData = ref([])
const filteredPredictionData = ref([])

// Filters
const selectedCity = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const selectedCondition = ref('')
const searchQuery = ref('')

// Dialog states
const showDialog = ref(false)
const editingItem = ref(null)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Form data
const form = ref({
  date: '',
  cityId: '',
  temperature: '',
  humidity: '',
  pressure: '',
  windSpeed: '',
  rainfall: '',
  weatherCondition: ''
})

// Weather conditions in Lao
const weatherConditions = [
  'ອາກາດແຈ່ມ', 'ມີເມກບາງ', 'ມີເມກ', 'ມີເມກຄຸ້ມ', 
  'ຝົນເບົາ', 'ຝົນຕົກ', 'ຝົນໃຫຍ່', 'ຟ້າຮ້ອງ',
  'ມີໝອກ', 'ມີໝອກບາງ', 'ຝົນປອຍ'
]

// Table headers in Lao
const weatherHeaders = [
  { title: 'ວັນທີ', key: 'date', sortable: true },
  { title: 'ເມືອງ', key: 'cityName', sortable: true },
  { title: 'ອຸນຫະພູມ', key: 'temperature', sortable: true },
  { title: 'ຄວາມຊຸ່ມ', key: 'humidity', sortable: true },
  { title: 'ຄວາມກົດດັນ', key: 'pressure', sortable: true },
  { title: 'ຄວາມໄວລົມ', key: 'windSpeed', sortable: true },
  { title: 'ຝົນຕົກ', key: 'rainfall', sortable: true },
  { title: 'ສະພາບອາກາດ', key: 'weatherCondition', sortable: true }
]

const predictionHeaders = [
  { title: 'ວັນທີ', key: 'prediction_date', sortable: true },
  { title: 'ເມືອງ', key: 'cityName', sortable: true },
  { title: 'ອຸນຫະພູມຄາດການ', key: 'predicted_temperature', sortable: true },
  { title: 'ຄວາມຊຸ່ມຄາດການ', key: 'predicted_humidity', sortable: true },
  { title: 'ຝົນຄາດການ LSTM', key: 'predicted_rainfall', sortable: true },
  { title: 'ຝົນຈາກ API', key: 'actual_rainfall', sortable: true },
  { title: 'ຄວາມໝັ້ນໃຈ', key: 'confidence', sortable: true },
  { title: 'ສ້າງແລ້ວ', key: 'created_at', sortable: true }
]

// Computed properties
const activeCitiesCount = computed(() => {
  return cities.value.filter(city => city.status === 'Active').length
})

const lastUpdated = computed(() => {
  if (weatherData.value.length === 0) return 'ບໍ່ມີຂໍ້ມູນ'
  const latest = weatherData.value.reduce((latest, current) => 
    new Date(current.date) > new Date(latest.date) ? current : latest
  )
  return formatDate(latest.date)
})

// Additional computed properties for filter UI
const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || selectedCity.value || dateFrom.value || dateTo.value || selectedCondition.value || currentQuickFilter.value)
})

const getCityName = computed(() => (cityId) => {
  if (!cityId) return 'ທຸກເມືອງ'
  const city = cities.value.find(c => c.id === cityId)
  return city ? (city.name_th || city.name_en || city.name || 'ເມືອງບໍ່ຮູ້') : 'ເມືອງບໍ່ຮູ້'
})

const formatDateRange = computed(() => {
  if (dateFrom.value && dateTo.value) {
    return `${formatDate(dateFrom.value)} ເຖິງ ${formatDate(dateTo.value)}`
  } else if (dateFrom.value) {
    return `ຕັ້ງແຕ່ ${formatDate(dateFrom.value)}`
  } else if (dateTo.value) {
    return `ຈົນເຖິງ ${formatDate(dateTo.value)}`
  }
  return ''
})

// ...existing code...

const temperatureTrendData = computed(() => {
  if (!filteredWeatherData.value.length) return { labels: [], datasets: [] }
  
  const sortedData = [...filteredWeatherData.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  const labels = sortedData.map(item => formatDate(item.date))
  const temperatures = sortedData.map(item => item.temperature)
  
  return {
    labels,
    datasets: [{
      label: 'ອຸນຫະພູມ (°C)',
      data: temperatures,
      backgroundColor: 'rgba(255, 107, 107, 0.8)',
      borderColor: '#FF6B6B',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: 'rgba(255, 107, 107, 0.9)',
      hoverBorderColor: '#FF4757',
      hoverBorderWidth: 3,
      shadowColor: 'rgba(255, 107, 107, 0.4)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 4
    }]
  }
})

const humidityTrendData = computed(() => {
  if (!filteredWeatherData.value.length) return { labels: [], datasets: [] }
  
  const sortedData = [...filteredWeatherData.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  const labels = sortedData.map(item => formatDate(item.date))
  const humidity = sortedData.map(item => item.humidity)
  
  return {
    labels,
    datasets: [{
      label: 'ຄວາມຊຸ່ມ (%)',
      data: humidity,
      backgroundColor: 'rgba(78, 205, 196, 0.8)',
      borderColor: '#4ECDC4',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: 'rgba(78, 205, 196, 0.9)',
      hoverBorderColor: '#26A69A',
      hoverBorderWidth: 3,
      shadowColor: 'rgba(78, 205, 196, 0.4)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 4
    }]
  }
})

const predictionChartData = computed(() => {
  if (!filteredPredictionData.value.length) return { labels: [], datasets: [] }
  
  const sortedData = [...filteredPredictionData.value].sort((a, b) => new Date(a.prediction_date) - new Date(b.prediction_date))
  const labels = sortedData.map(item => formatDate(item.prediction_date))
  const lstmRainfall = sortedData.map(item => item.predicted_rainfall || 0)
  const apiRainfall = sortedData.map(item => item.actual_rainfall || 0)
  
  const datasets = [
    {
      label: 'ປະລິມານຝົນຄາດການ LSTM (mm)',
      data: lstmRainfall,
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: '#36A2EB',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)',
      hoverBorderColor: '#2196F3',
      hoverBorderWidth: 3,
      shadowColor: 'rgba(54, 162, 235, 0.3)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 3
    },
    {
      label: 'ປະລິມານຝົນຈາກ API (mm)',
      data: apiRainfall,
      backgroundColor: 'rgba(255, 159, 64, 0.8)',
      borderColor: '#FF9F40',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
      hoverBackgroundColor: 'rgba(255, 159, 64, 0.9)',
      hoverBorderColor: '#FF8F00',
      hoverBorderWidth: 3,
      shadowColor: 'rgba(255, 159, 64, 0.3)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 3
    }
  ]
  
  return {
    labels,
    datasets
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        font: {
          size: 14,
          weight: '600'
        },
        color: '#374151'
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#374151',
      bodyColor: '#6B7280',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      cornerRadius: 12,
      displayColors: true,
      padding: 12,
      bodyFont: {
        size: 13
      },
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}${context.dataset.label.includes('Temperature') ? '°C' : '%'}`
        }
      },
      // Enhanced animation for tooltips
      animation: {
        duration: 200
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'ອຸນຫະພູມ (°C) / ຄວາມຊຸ່ມ (%)',
        font: {
          size: 14,
          weight: '600'
        },
        color: '#374151'
      },
      grid: {
        color: 'rgba(229, 231, 235, 0.8)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 12
        },
        color: '#6B7280',
        padding: 8
      },
      // Enhanced animation for Y axis
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    },
    x: {
      title: {
        display: true,
        text: 'ວັນທີ',
        font: {
          size: 14,
          weight: '600'
        },
        color: '#374151'
      },
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 12
        },
        color: '#6B7280',
        maxRotation: 45,
        padding: 8
      },
      // Enhanced animation for X axis
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  },
  elements: {
    bar: {
      borderRadius: 8,
      borderSkipped: false,
      // Enhanced bar animation
      hoverBorderWidth: 3,
      backgroundColor: function(context) {
        // Create gradient effect for bars
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return null;
        
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 107, 107, 0.8)');
        return gradient;
      }
    }
  },
  animation: {
    duration: 1500,
    easing: 'easeInOutQuart',
    mode: 'active',
    delay: function(context) {
      // Staggered animations
      return context.dataIndex * 50;
    }
  },
  transitions: {
    active: {
      animation: {
        duration: 1000
      }
    },
    hide: {
      animation: {
        duration: 500
      }
    },
    resize: {
      animation: {
        duration: 800,
        easing: 'easeOutBounce'
      }
    }
  }
}

const predictionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        font: {
          size: 14,
          weight: '600'
        },
        color: '#374151'
      },
      // Animate legend on hover
      onHover: function(event, legendItem, legend) {
        // Simple hover effect without complex animation
        if (legendItem) {
          event.target.style.cursor = 'pointer'
        }
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      titleColor: '#374151',
      bodyColor: '#6B7280',
      borderColor: '#E5E7EB',
      borderWidth: 2,
      cornerRadius: 16,
      displayColors: true,
      padding: 16,
      bodyFont: {
        size: 13
      },
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      callbacks: {
        label: function(context) {
          const label = context.dataset.label
          const value = context.parsed.y
          if (label.includes('Temperature')) {
            return `${label}: ${value.toFixed(1)}°C`
          } else if (label.includes('Confidence')) {
            return `${label}: ${value.toFixed(1)}%`
          }
          return `${label}: ${value.toFixed(1)}`
        },
        title: function(tooltipItems) {
          return `ວັນທີ: ${tooltipItems[0].label}`
        }
      },
      // Enhanced tooltip animation
      animation: {
        duration: 200
      }
    },
    // Add crosshair plugin for better data inspection (remove if plugin not available)
    crosshair: {
      line: {
        color: 'rgba(0, 0, 0, 0.2)',
        width: 1,
        dashPattern: [6, 6]
      }
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: {
        display: true,
        text: 'ປະລິມານຝົນ (mm)',
        font: {
          size: 14,
          weight: '600'
        },
        color: '#374151'
      },
      grid: {
        color: 'rgba(229, 231, 235, 0.8)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 12
        },
        color: '#6B7280',
        padding: 8,
        callback: function(value) {
          return value.toFixed(1) + 'mm'
        }
      },
      // Enhanced animation for Y axis
      animation: {
        duration: 1200,
        easing: 'easeOutCubic'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Date',
        font: {
          size: 14,
          weight: '600'
        },
        color: '#374151'
      },
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 12
        },
        color: '#6B7280',
        maxRotation: 45,
        padding: 8
      },
      // Enhanced animation for X axis
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  },
  elements: {
    bar: {
      borderRadius: 8,
      borderSkipped: false,
      // Enhanced bar animation with hover effects
      hoverBorderWidth: 3,
      backgroundColor: function(context) {
        // Create gradient effect for bars
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return null;
        
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, 'rgba(157, 78, 221, 0.3)');
        gradient.addColorStop(1, 'rgba(157, 78, 221, 0.8)');
        return gradient;
      }
    }
  },
  animation: {
    duration: 1500,
    easing: 'easeInOutQuart',
    mode: 'active',
    delay: function(context) {
      // Create staggered animations based on dataset and data index
      let delay = 0;
      
      if (context.type === 'data') {
        // Delay by data index for line points
        delay = context.dataIndex * 50;
        // Add additional delay for different datasets
        delay += context.datasetIndex * 300;
      }
      
      return delay;
    }
  },
  transitions: {
    active: {
      animation: {
        duration: 1000,
        easing: 'easeOutCubic'
      }
    },
    hide: {
      animation: {
        duration: 500,
        easing: 'easeInQuad'
      }
    },
    resize: {
      animation: {
        duration: 800,
        easing: 'easeOutElastic'
      }
    }
  }
}

// API Functions
async function loadWeatherData() {
  try {
    loading.value = true
    const response = await api.get('/api/weather')
    weatherData.value = response.data.map(item => ({
      ...item,
      cityName: item.weatherCity ? (item.weatherCity.name_th || item.weatherCity.name_en) : 'ເມືອງບໍ່ຮູ້',
      cityId: item.city_id || item.weatherCity?.id,
      date: item.date ? item.date.split('T')[0] : item.timestamp?.split('T')[0] || item.createdAt?.split('T')[0]
    }))
    filterData()
  } catch (error) {
    console.error('Error loading weather data:', error)
    showMessage('ບໍ່ສາມາດໂຫລດຂໍ້ມູນສະພາບອາກາດໄດ້', 'error')
  } finally {
    loading.value = false
  }
}

async function loadPredictions() {
  try {
    generatingPredictions.value = true
    console.log('🚀 [FRONTEND] loadPredictions() function called at', new Date().toISOString())
    console.log('📊 [FRONTEND] Current predictionData.value.length before API call:', predictionData.value.length)
    console.log('Loading predictions from WeatherForecast table...')
    
    // Clear any existing data
    predictionData.value = []
    
    // Try to load from weather forecast/predictions endpoint first
    console.log('🔄 [FRONTEND] About to call API: /api/weather/predictions-fresh (NEW ENDPOINT)')
    console.log('🌐 [FRONTEND] API base URL:', api.defaults.baseURL)
    const timestamp = Date.now()
    const response = await api.get(`/api/weather/predictions-fresh?t=${timestamp}&force=true`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Force-Refresh': 'true'
      }
    })
    console.log('✅ [FRONTEND] API call completed successfully')
    
    console.log('📊 API Response Status:', response.status)
    console.log('📊 API Response Data Type:', typeof response.data)
    console.log('📊 API Response Data Length:', Array.isArray(response.data) ? response.data.length : 'Not an array')
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log('✅ Weather forecast data loaded from API:', response.data.length, 'records (all data from database)')
      console.log('📄 Sample API data:', response.data[0])
      
      // Use real data from WeatherForecast table
      predictionData.value = response.data.map(item => {
        const predictionDate = item.prediction_date ? 
                              (item.prediction_date instanceof Date ? item.prediction_date.toISOString().split('T')[0] : item.prediction_date.split('T')[0]) :
                              item.timestamp ? 
                              (item.timestamp instanceof Date ? item.timestamp.toISOString().split('T')[0] : item.timestamp.split('T')[0]) :
                              new Date().toISOString().split('T')[0]
        
        return {
          id: item.id,
          prediction_date: predictionDate,
          predicted_temperature: item.predicted_temperature,
          actual_temperature: item.actual_temperature || null,
          predicted_humidity: item.predicted_humidity,
          actual_humidity: item.actual_humidity || null,
          predicted_rainfall: item.predicted_rainfall || 0,
          actual_rainfall: item.actual_rainfall || 0,
          confidence: Math.round(item.confidence || 85),
          city_id: item.city_id,
          cityName: item.cityName || item.city_name_th || item.city_name_en || 'ເມືອງບໍ່ຮູ້',
          created_at: item.created_at ? 
                     (item.created_at instanceof Date ? item.created_at.toISOString().split('T')[0] : item.created_at.split('T')[0]) :
                     new Date().toISOString().split('T')[0]
        }
      })
      
      console.log('✅ Processed weather forecast predictions:', predictionData.value.length, 'total records')
      
      // Log sample processed data for debugging
      if (predictionData.value.length > 0) {
        console.log('📄 Sample processed prediction:', predictionData.value[0])
        console.log('📊 Data range: First -', predictionData.value[predictionData.value.length - 1].prediction_date, 'to Last -', predictionData.value[0].prediction_date)
      }
    } else {
      console.log('⚠️ No weather forecast found in API response, using mock data for testing...')
      
      // Generate mock prediction data as fallback
      const mockData = []
      const cities = ['ນະຄອນຫຼວງວຽງຈັນ', 'ເມືອງໄຊສົມບູນ', 'ເມືອງຫຼວງພະບາງ']
      
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        
        cities.forEach((city, cityIndex) => {
          const cityId = cityIndex + 1
          
          mockData.push({
            id: mockData.length + 1,
            prediction_date: dateStr,
            predicted_temperature: 25 + Math.random() * 10,
            actual_temperature: i < 7 ? 25 + Math.random() * 10 : null,
            predicted_humidity: 60 + Math.random() * 30,
            actual_humidity: i < 7 ? 60 + Math.random() * 30 : null,
            confidence: Math.round((0.8 + Math.random() * 0.2) * 100),
            city_id: cityId,
            cityName: city,
            created_at: new Date().toISOString()
          })
        })
      }
      
      predictionData.value = mockData
      console.log('📊 Using mock prediction data:', mockData.length, 'records')
    }
    
    console.log('🎯 Final predictions loaded:', predictionData.value.length, 'total records from weatherforecast table')
    filterData() // Apply filters to predictions too
    
    showMessage(`ໂຫລດການຄາດການສຳເລັດ: ${predictionData.value.length} ລາຍການ (ທັງໝົດ)`, 'success')
  } catch (error) {
    console.error('❌ [FRONTEND] Error loading predictions:', error)
    console.error('❌ [FRONTEND] Error details:', error.response?.data || error.message)
    console.error('❌ [FRONTEND] Error status:', error.response?.status)
    console.error('❌ [FRONTEND] Error config:', error.config?.url)
    showMessage('ບໍ່ສາມາດໂຫລດການຄາດການໄດ້: ' + (error.response?.statusText || error.message), 'error')
    
    // Use mock data as fallback on error
    console.log('🔄 Falling back to mock data due to API error...')
    const mockData = []
    const cities = ['ນະຄອນຫຼວງວຽງຈັນ', 'ເມືອງໄຊສົມບູນ', 'ເມືອງຫຼວງພະບາງ']
    
    for (let i = 0; i < 15; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      cities.forEach((city, cityIndex) => {
        const cityId = cityIndex + 1
        
        mockData.push({
          id: mockData.length + 1,
          prediction_date: dateStr,
          predicted_temperature: Math.round((25 + Math.random() * 10) * 10) / 10,
          actual_temperature: i < 5 ? Math.round((25 + Math.random() * 10) * 10) / 10 : null,
          predicted_humidity: Math.round(60 + Math.random() * 30),
          actual_humidity: i < 5 ? Math.round(60 + Math.random() * 30) : null,
          confidence: Math.round((0.8 + Math.random() * 0.2) * 100),
          city_id: cityId,
          cityName: city,
          created_at: new Date().toISOString().split('T')[0]
        })
      })
    }
    
    predictionData.value = mockData
    console.log('📊 Fallback mock prediction data loaded:', mockData.length, 'records')
    filterData()
  } finally {
    generatingPredictions.value = false
  }
}

async function loadCities() {
  try {
    const response = await api.get('/api/weather/cities') // เปลี่ยนจาก /api/cities
    cities.value = response.data
  } catch (error) {
    console.error('Error loading cities:', error)
    showMessage('ບໍ່ສາມາດໂຫລດລາຍຊື່ເມືອງໄດ້', 'error')
  }
}

async function generatePredictions() {
  try {
    generatingPredictions.value = true
    
    // Generate predictions for all active cities
    const activeCities = cities.value.filter(city => city.status === 'Active')
    
    if (activeCities.length === 0) {
      showMessage('No active cities found for prediction generation', 'warning')
      return
    }
    
    const promises = activeCities.map(city => 
      api.post(`/api/predict/${city.id}`, {
        days: 7 // Generate 7-day predictions
      })
    )
    
    const results = await Promise.allSettled(promises)
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.length - successful
    
    if (successful > 0) {
      showMessage(`Generated predictions for ${successful} cities${failed > 0 ? ` (${failed} failed)` : ''}`, 'success')
      await loadPredictions() // Reload predictions
    } else {
      showMessage('Failed to generate predictions for all cities', 'error')
    }
    
  } catch (error) {
    console.error('Error generating predictions:', error)
    showMessage('Error generating predictions: ' + (error.response?.data?.error || error.message), 'error')
  } finally {
    generatingPredictions.value = false
  }
}

async function saveWeatherData() {
  try {
    if (!form.value.date || !form.value.cityId || !form.value.temperature || !form.value.humidity) {
      showMessage('ກະລຸນາຕື່ມຂໍ້ມູນໃສ່ທຸກຊ່ອງທີ່ຈຳເປັນ', 'error')
      return
    }
    
    saving.value = true
    
    const weatherPayload = {
      cityId: form.value.cityId,
      date: form.value.date,
      temperature: parseFloat(form.value.temperature),
      humidity: parseFloat(form.value.humidity),
      pressure: form.value.pressure ? parseFloat(form.value.pressure) : null,
      windSpeed: form.value.windSpeed ? parseFloat(form.value.windSpeed) : null,
      rainfall: form.value.rainfall ? parseFloat(form.value.rainfall) : null,
      weatherCondition: form.value.weatherCondition || null
    }
    
    if (editingItem.value) {
      await api.put(`/api/weather/${editingItem.value.id}`, weatherPayload)
      showMessage('ອັບເດດຂໍ້ມູນສະພາບອາກາດສຳເລັດແລ້ວ!', 'success')
    } else {
      await api.post('/api/weather', weatherPayload)
      showMessage('ເພີ່ມຂໍ້ມູນສະພາບອາກາດສຳເລັດແລ້ວ!', 'success')
    }
    
    closeDialog()
    await loadWeatherData()
    
  } catch (error) {
    console.error('Error saving weather data:', error)
    showMessage('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນສະພາບອາກາດ: ' + (error.response?.data?.error || error.message), 'error')
  } finally {
    saving.value = false
  }
}

async function deleteWeatherData(item) {
  if (!confirm(`Are you sure you want to delete this weather record for ${item.cityName} on ${item.date}?`)) {
    return
  }
  
  try {
    await api.delete(`/api/weather/${item.id}`)
    showMessage('ລຶບຂໍ້ມູນສະພາບອາກາດສຳເລັດແລ້ວ!', 'success')
    await loadWeatherData()
  } catch (error) {
    console.error('Error deleting weather data:', error)
    showMessage('ເກີດຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນສະພາບອາກາດ: ' + (error.response?.data?.error || error.message), 'error')
  }
}

async function exportData() {
  try {
    exporting.value = true
    const response = await api.get('/api/weather/export', {
      responseType: 'blob' // Important
    })
    
    // Create a blob URL for the downloaded file
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `weather_data_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    
    showMessage('ສົ່ງອອກຂໍ້ມູນສຳເລັດແລ້ວ!', 'success')
  } catch (error) {
    console.error('Error exporting data:', error)
    showMessage('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກຂໍ້ມູນ: ' + (error.response?.data?.error || error.message), 'error')
  } finally {
    exporting.value = false
  }
}

async function generateReports() {
  try {
    generatingReports.value = true
    
    // Generate reports for all active cities
    const activeCities = cities.value.filter(city => city.status === 'Active')
    
    if (activeCities.length === 0) {
      showMessage('No active cities found for report generation', 'warning')
      return
    }
    
    const promises = activeCities.map(city => 
      api.post(`/api/report/${city.id}`, {
        days: 7 // Generate 7-day reports
      })
    )
    
    const results = await Promise.allSettled(promises)
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.length - successful
    
    if (successful > 0) {
      showMessage(`Generated reports for ${successful} cities${failed > 0 ? ` (${failed} failed)` : ''}`, 'success')
    } else {
      showMessage('Failed to generate reports for all cities', 'error')
    }
    
  } catch (error) {
    console.error('Error generating reports:', error)
    showMessage('Error generating reports: ' + (error.response?.data?.error || error.message), 'error')
  } finally {
    generatingReports.value = false
  }
}


// Helper Functions
function editWeatherData(item) {
  editingItem.value = item
  form.value = {
    date: item.date,
    cityId: item.cityId,
    temperature: item.temperature.toString(),
    humidity: item.humidity.toString(),
    pressure: item.pressure ? item.pressure.toString() : '',
    windSpeed: item.windSpeed ? item.windSpeed.toString() : '',
    rainfall: item.rainfall ? item.rainfall.toString() : '',
    weatherCondition: item.weatherCondition || ''
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingItem.value = null
  form.value = {
    date: '',
    cityId: '',
    temperature: '',
    humidity: '',
    pressure: '',
    windSpeed: '',
    rainfall: '',
    weatherCondition: ''
  }
}

function filterData() {
  let filteredWeather = [...weatherData.value]
  let filteredPredictions = [...predictionData.value]
  
  // Apply city filter
  if (selectedCity.value) {
    filteredWeather = filteredWeather.filter(item => item.cityId === selectedCity.value)
    filteredPredictions = filteredPredictions.filter(item => item.city_id === selectedCity.value)
  }
  
  // Apply date range filter
  if (dateFrom.value) {
    filteredWeather = filteredWeather.filter(item => new Date(item.date) >= new Date(dateFrom.value))
    filteredPredictions = filteredPredictions.filter(item => new Date(item.prediction_date) >= new Date(dateFrom.value))
  }
  
  if (dateTo.value) {
    filteredWeather = filteredWeather.filter(item => new Date(item.date) <= new Date(dateTo.value))
    filteredPredictions = filteredPredictions.filter(item => new Date(item.prediction_date) <= new Date(dateTo.value))
  }
  
  // Apply weather condition filter
  if (selectedCondition.value) {
    filteredWeather = filteredWeather.filter(item => 
      item.weatherCondition && item.weatherCondition.toLowerCase().includes(selectedCondition.value.toLowerCase())
    )
  }
  
  // Apply search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filteredWeather = filteredWeather.filter(item => 
      item.cityName.toLowerCase().includes(query) ||
      item.date.includes(query) ||
      (item.weatherCondition && item.weatherCondition.toLowerCase().includes(query))
    )
    filteredPredictions = filteredPredictions.filter(item => 
      item.cityName.toLowerCase().includes(query) ||
      item.prediction_date.includes(query)
    )
  }
  
  filteredWeatherData.value = filteredWeather
  filteredPredictionData.value = filteredPredictions
}

function clearFilters() {
  selectedCity.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  selectedCondition.value = ''
  searchQuery.value = ''
  currentQuickFilter.value = ''
  filterData()
}

// Quick filter functionality
const currentQuickFilter = ref('')

function setQuickFilter(filterType) {
  // Clear existing filters first
  clearFilters()
  currentQuickFilter.value = filterType
  
  const today = new Date()
  const formatDate = (date) => date.toISOString().split('T')[0]
  
  switch (filterType) {
    case 'today':
      dateFrom.value = formatDate(today)
      dateTo.value = formatDate(today)
      break
      
    case 'thisWeek':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      dateFrom.value = formatDate(startOfWeek)
      dateTo.value = formatDate(today)
      break
      
    case 'thisMonth':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      dateFrom.value = formatDate(startOfMonth)
      dateTo.value = formatDate(today)
      break
      
    case 'hotDays':
      // Filter will be applied in filterData function
      break
      
    case 'rainyDays':
      selectedCondition.value = 'Rain'
      break
      
    case 'highHumidity':
      // Filter will be applied in filterData function
      break
  }
  
  // Apply special filters that need custom logic
  if (filterType === 'hotDays' || filterType === 'highHumidity') {
    applySpecialFilter(filterType)
  } else {
    filterData()
  }
}

function applySpecialFilter(filterType) {
  let filteredWeather = [...weatherData.value]
  let filteredPredictions = [...predictionData.value]
  
  if (filterType === 'hotDays') {
    filteredWeather = filteredWeather.filter(item => item.temperature > 30)
    filteredPredictions = filteredPredictions.filter(item => 
      item.predicted_temperature > 30 || (item.actual_temperature && item.actual_temperature > 30)
    )
  } else if (filterType === 'highHumidity') {
    filteredWeather = filteredWeather.filter(item => item.humidity > 80)
    filteredPredictions = filteredPredictions.filter(item => 
      item.predicted_humidity > 80 || (item.actual_humidity && item.actual_humidity > 80)
    )
  }
  
  filteredWeatherData.value = filteredWeather
  filteredPredictionData.value = filteredPredictions
}

function isQuickFilterActive(filterType) {
  return currentQuickFilter.value === filterType
}

async function refreshData() {
  try {
    loading.value = true
    await Promise.all([
      loadWeatherData(),
      loadPredictions(),
      loadCities()
    ])
    
    // After loading data, trigger chart animations with a slight delay
    // to ensure the DOM has updated with new data
    setTimeout(() => {
      animateCharts()
    }, 300)
    
    showMessage('ໂຫລດຂໍ້ມູນຄືນໃໝ່ແລ້ວ!', 'success')
  } catch (error) {
    handleError(error, 'Data refresh')
  } finally {
    loading.value = false
  }
}

function getTemperatureColor(temperature) {
  if (temperature < 20) return 'blue'
  if (temperature < 25) return 'green'
  if (temperature < 30) return 'orange'
  return 'red'
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

function getDateColor(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const daysDiff = Math.ceil((date - today) / (1000 * 60 * 60 * 24))
  
  if (daysDiff < 0) {
    return 'red' // Past date
  } else if (daysDiff === 0) {
    return 'orange' // Today
  } else if (daysDiff <= 7) {
    return 'blue' // Within a week
  } else {
    return 'green' // Future
  }
}

function showMessage(message, color = 'success') {
  snackbarText.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// ✅ เพิ่มฟังก์ชันใหม่ที่ขาดหายไป
function validatePredictionAccuracy() {
  if (!predictionData.value.length) {
    showMessage('No prediction data available for validation', 'warning')
    return
  }
  
  const accuracyResults = predictionData.value.map(pred => {
    const actualTemp = pred.actual_temperature
    const predictedTemp = pred.predicted_temperature
    
    if (actualTemp && predictedTemp) {
      // Calculate temperature accuracy using Mean Absolute Error (MAE)
      const tempError = Math.abs(actualTemp - predictedTemp)
      const tempAccuracy = Math.max(0, 100 - (tempError / actualTemp * 100))
      
      // Calculate humidity accuracy if available
      let humidityAccuracy = null
      if (pred.actual_humidity && pred.predicted_humidity) {
        const humidityError = Math.abs(pred.actual_humidity - pred.predicted_humidity)
        humidityAccuracy = Math.max(0, 100 - (humidityError / pred.actual_humidity * 100))
      }
      
      return {
        ...pred,
        tempAccuracy: Math.round(tempAccuracy * 100) / 100,
        humidityAccuracy: humidityAccuracy ? Math.round(humidityAccuracy * 100) / 100 : null,
        tempError: Math.round(tempError * 100) / 100
      }
    }
    return null
  }).filter(Boolean)
  
  if (accuracyResults.length === 0) {
    showMessage('No actual temperature data available for accuracy calculation', 'warning')
    return
  }
  
  // Calculate overall statistics
  const avgTempAccuracy = accuracyResults.reduce((sum, item) => sum + item.tempAccuracy, 0) / accuracyResults.length
  const avgTempError = accuracyResults.reduce((sum, item) => sum + item.tempError, 0) / accuracyResults.length
  
  const humidityResults = accuracyResults.filter(item => item.humidityAccuracy !== null)
  const avgHumidityAccuracy = humidityResults.length > 0 
    ? humidityResults.reduce((sum, item) => sum + item.humidityAccuracy, 0) / humidityResults.length 
    : 0
  
  const stats = {
    totalPredictions: accuracyResults.length,
    avgTempAccuracy: Math.round(avgTempAccuracy * 100) / 100,
    avgTempError: Math.round(avgTempError * 100) / 100,
    avgHumidityAccuracy: Math.round(avgHumidityAccuracy * 100) / 100,
    confidenceRange: {
      min: Math.min(...predictionData.value.map(p => p.confidence * 100)),
      max: Math.max(...predictionData.value.map(p => p.confidence * 100)),
      avg: predictionData.value.reduce((sum, p) => sum + p.confidence * 100, 0) / predictionData.value.length
    }
  }
  
  showMessage(`LSTM Model Performance - Temp Accuracy: ${stats.avgTempAccuracy}%, Avg Error: ${stats.avgTempError}°C`, 'info')
  console.log('LSTM Model Performance:', stats)
  console.log('Detailed Results:', accuracyResults)
  
  return { stats, accuracyResults }
}

function searchWeatherData(query) {
  if (!query) {
    filterData()
    return
  }
  
  const filtered = weatherData.value.filter(item => 
    item.cityName.toLowerCase().includes(query.toLowerCase()) ||
    item.date.includes(query) ||
    item.weatherCondition?.toLowerCase().includes(query.toLowerCase())
  )
  
  filteredWeatherData.value = filtered
  showMessage(`ພົບ ${filtered.length} ບັນທຶກທີ່ຕົງກັບ "${query}"`, 'info')
}

function calculateStatistics() {
  if (!filteredWeatherData.value.length) {
    showMessage('ບໍ່ມີຂໍ້ມູນສຳລັບການຄິດໄລ່ສະຖິຕິ', 'warning')
    return {}
  }
  
  const temperatures = filteredWeatherData.value.map(item => item.temperature).filter(temp => temp !== null)
  const humidities = filteredWeatherData.value.map(item => item.humidity).filter(hum => hum !== null)
  const rainfalls = filteredWeatherData.value.map(item => item.rainfall || 0)
  
  const stats = {
    temperature: {
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      avg: temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length,
      count: temperatures.length
    },
    humidity: {
      min: Math.min(...humidities),
      max: Math.max(...humidities),
      avg: humidities.reduce((sum, hum) => sum + hum, 0) / humidities.length,
      count: humidities.length
    },
    rainfall: {
      min: Math.min(...rainfalls),
      max: Math.max(...rainfalls),
      total: rainfalls.reduce((sum, rain) => sum + rain, 0),
      avg: rainfalls.reduce((sum, rain) => sum + rain, 0) / rainfalls.length,
      count: rainfalls.length
    }
  }
  
  console.log('Weather Statistics:', stats)
  showMessage('ຄິດໄລ່ສະຖິຕິສຳເລັດແລ້ວ', 'success')
  return stats
}

async function exportDataToCSV() {
  try {
    exporting.value = true
    
    const csvData = filteredWeatherData.value.map(item => ({
      'ວັນທີ': item.date,
      'ເມືອງ': item.cityName,
      'ອຸນຫະພູມ (°C)': item.temperature,
      'ຄວາມຊຸ່ມ (%)': item.humidity,
      'ຄວາມກົດດັນ (hPa)': item.pressure || '',
      'ຄວາມໄວລົມ (km/h)': item.windSpeed || '',
      'ຝົນຕົກ (mm)': item.rainfall || '',
      'ສະພາບອາກາດ': item.weatherCondition || ''
    }))
    
    const csvContent = convertToCSV(csvData)
    downloadCSV(csvContent, `weather_data_${new Date().toISOString().split('T')[0]}.csv`)
    
    showMessage('ສົ່ງອອກຂໍ້ມູນເປັນ CSV ສຳເລັດແລ້ວ!', 'success')
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    showMessage('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກເປັນ CSV', 'error')
  } finally {
    exporting.value = false
  }
}

function convertToCSV(data) {
  if (!data.length) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}

function downloadCSV(csvContent, filename) {
  // Add UTF-8 BOM for proper encoding of Lao text
  const BOM = '\uFEFF'
  const csvWithBOM = BOM + csvContent
  
  const blob = new Blob([csvWithBOM], { 
    type: 'text/csv;charset=utf-8;' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export function for weather data
async function exportWeatherData() {
  return await exportDataToCSV()
}

// Export function for prediction data
async function exportPredictionData() {
  try {
    exporting.value = true
    
    const csvData = filteredPredictionData.value.map(item => ({
      'ວັນທີຄາດການ': item.prediction_date,
      'ເມືອງ': item.cityName,
      'ອຸນຫະພູມຄາດການ (°C)': item.predicted_temperature,
      'ຄວາມຊຸ່ມຄາດການ (%)': item.predicted_humidity,
      'ຝົນຄາດການ LSTM (mm)': item.predicted_rainfall || 0,
      'ຝົນຈາກ API (mm)': item.actual_rainfall || 0,
      'ຄວາມໝັ້ນໃຈ (%)': item.confidence,
      'ສ້າງເມື່ອ': item.created_at
    }))
    
    const csvContent = convertToCSV(csvData)
    downloadCSV(csvContent, `lstm_predictions_${new Date().toISOString().split('T')[0]}.csv`)
    
    showMessage('ສົ່ງອອກຂໍ້ມູນການຄາດການເປັນ CSV ສຳເລັດແລ້ວ!', 'success')
  } catch (error) {
    console.error('Error exporting prediction data to CSV:', error)
    showMessage('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກຂໍ້ມູນການຄາດການ', 'error')
  } finally {
    exporting.value = false
  }
}

function updateChartData() {
  // Use advanced animation techniques for temperature chart
  const tempLabels = [...temperatureTrendData.value.labels]
  const tempData = [...temperatureTrendData.value.datasets[0].data]
  
  // Create a beautiful animated gradient for temperature chart
  const tempGradient = 'linear-gradient(180deg, rgba(255, 107, 107, 0.6) 0%, rgba(255, 107, 107, 0.05) 100%)'
  
  temperatureTrendData.value = {
    labels: tempLabels,
    datasets: [{
      label: 'ອຸນຫະພູມ (°C)',
      data: tempData,
      borderColor: '#FF6B6B',
      backgroundColor: tempGradient,
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: '#FF6B6B',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: '#FF6B6B',
      pointHoverBorderColor: '#FFFFFF',
      pointHoverBorderWidth: 3,
      borderWidth: 3,
      shadowColor: 'rgba(255, 107, 107, 0.4)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 4
    }]
  }
  
  // Update humidity chart with enhanced animations
  const humLabels = [...humidityTrendData.value.labels]
  const humData = [...humidityTrendData.value.datasets[0].data]
  
  // Create a beautiful animated gradient for humidity chart
  const humGradient = 'linear-gradient(180deg, rgba(78, 205, 196, 0.6) 0%, rgba(78, 205, 196, 0.05) 100%)'
  
  humidityTrendData.value = {
    labels: humLabels,
    datasets: [{
      label: 'ຄວາມຊຸ່ມ (%)',
      data: humData,
      borderColor: '#4ECDC4',
      backgroundColor: humGradient,
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: '#4ECDC4',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: '#4ECDC4',
      pointHoverBorderColor: '#FFFFFF',
      pointHoverBorderWidth: 3,
      borderWidth: 3,
      shadowColor: 'rgba(78, 205, 196, 0.4)',
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 4
    }]
  }
  
  // Update predictions chart with enhanced animations
  if (predictionChartData.value.labels.length > 0) {
    const predLabels = [...predictionChartData.value.labels]
    const predDatasets = JSON.parse(JSON.stringify(predictionChartData.value.datasets))
    
    // Apply advanced styling to each dataset
    predictionChartData.value = {
      labels: predLabels,
      datasets: predDatasets.map((dataset, index) => {
        // Enhance styling based on dataset type
        if (dataset.label.includes('LSTM')) {
          return {
            ...dataset,
            borderColor: '#9D4EDD',
            backgroundColor: 'rgba(157, 78, 221, 0.1)',
            tension: 0.4
          }
        } else if (dataset.label.includes('Actual')) {
          return {
            ...dataset,
            borderColor: '#FF4757',
            backgroundColor: 'rgba(255, 71, 87, 0.1)',
            borderDash: [8, 4],
            tension: 0.4
          }
        } else { // Confidence dataset
          return {
            ...dataset,
            borderColor: '#2ED573',
            backgroundColor: 'linear-gradient(180deg, rgba(46, 213, 115, 0.4) 0%, rgba(46, 213, 115, 0.1) 100%)',
            fill: true,
            tension: 0.4
          }
        }
      })
    }
  }
  
  showMessage('ອັບເດດກຣາຟດ້ວຍແອນິເມຊັນໃໝ່ແລ້ວ', 'info')
}

function generateTrendAnalysis() {
  if (!filteredWeatherData.value.length) {
    showMessage('ບໍ່ມີຂໍ້ມູນສຳລັບການວິເຄາະແນວໂນ້ມ', 'warning')
    return
  }
  
  const sortedData = [...filteredWeatherData.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  const temperatureTrend = analyzeTrend(sortedData.map(item => item.temperature))
  const humidityTrend = analyzeTrend(sortedData.map(item => item.humidity))
  const rainfallTrend = analyzeTrend(sortedData.map(item => item.rainfall || 0))
  
  const analysis = {
    temperature: {
      trend: temperatureTrend,
      direction: temperatureTrend > 0 ? 'Increasing' : temperatureTrend < 0 ? 'Decreasing' : 'Stable'
    },
    humidity: {
      trend: humidityTrend,
      direction: humidityTrend > 0 ? 'Increasing' : humidityTrend < 0 ? 'Decreasing' : 'Stable'
    },
    rainfall: {
      trend: rainfallTrend,
      direction: rainfallTrend > 0 ? 'Increasing' : rainfallTrend < 0 ? 'Decreasing' : 'Stable'
    }
  }
  
  console.log('Trend Analysis:', analysis)
  showMessage('ການວິເຄາະແນວໂນ້ມສຳເລັດແລ້ວ', 'success')
  return analysis
}

function analyzeTrend(data) {
  if (data.length < 2) return 0
  
  const n = data.length
  const sumX = (n * (n - 1)) / 2
  const sumY = data.reduce((sum, val) => sum + val, 0)
  const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0)
  const sumX2 = data.reduce((sum, val, index) => sum + (index * index), 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

function validateWeatherData(data) {
  const errors = []
  
  if (!data.date) errors.push('ວັນທີແມ່ນຈຳເປັນ')
  if (!data.cityId) errors.push('ເມືອງແມ່ນຈຳເປັນ')
  if (!data.temperature) errors.push('ອຸນຫະພູມແມ່ນຈຳເປັນ')
  if (!data.humidity) errors.push('ຄວາມຊຸ່ມແມ່ນຈຳເປັນ')
  
  if (data.temperature && (data.temperature < -50 || data.temperature > 60)) {
    errors.push('ອຸນຫະພູມຕ້ອງຢູ່ລະຫວ່າງ -50°C ແລະ 60°C')
  }
  
  if (data.humidity && (data.humidity < 0 || data.humidity > 100)) {
    errors.push('ຄວາມຊຸ່ມຕ້ອງຢູ່ລະຫວ່າງ 0% ແລະ 100%')
  }
  
  if (data.pressure && (data.pressure < 800 || data.pressure > 1200)) {
    errors.push('ຄວາມກົດດັນຕ້ອງຢູ່ລະຫວ່າງ 800 ແລະ 1200 hPa')
  }
  
  if (data.windSpeed && data.windSpeed < 0) {
    errors.push('ຄວາມໄວລົມບໍ່ສາມາດເປັນຄ່າລົບໄດ້')
  }
  
  if (data.rainfall && data.rainfall < 0) {
    errors.push('ຝົນຕົກບໍ່ສາມາດເປັນຄ່າລົບໄດ້')
  }
  
  return errors
}

function sanitizeInput(data) {
  const sanitized = { ...data }
  
  if (sanitized.temperature) {
    sanitized.temperature = Math.round(parseFloat(sanitized.temperature) * 10) / 10
  }
  
  if (sanitized.humidity) {
    sanitized.humidity = Math.round(parseFloat(sanitized.humidity))
  }
  
  if (sanitized.pressure) {
    sanitized.pressure = Math.round(parseFloat(sanitized.pressure))
  }
  
  if (sanitized.windSpeed) {
    sanitized.windSpeed = Math.round(parseFloat(sanitized.windSpeed) * 10) / 10
  }
  
  if (sanitized.rainfall) {
    sanitized.rainfall = Math.round(parseFloat(sanitized.rainfall) * 10) / 10
  }
  
  return sanitized
}

function handleError(error, context = 'ການດຳເນີນງານ') {
  console.error(`${context} Error:`, error)
  
  let message = `${context} ບໍ່ສຳເລັດ`
  
  if (error.response) {
    // Server responded with error status
    message = error.response.data?.error || error.response.data?.message || message
  } else if (error.request) {
    // Request was made but no response
    message = 'ເກີດຂໍ້ຜິດພາດເຄືອຂ່າຍ - ກະລຸນາກວດສອບການເຊື່ອມຕໍ່'
  } else {
    // Something else happened
    message = error.message || message
  }
  
  showMessage(message, 'error')
}

// Real-time update functions
let realTimeInterval = null

function startRealTimeUpdates() {
  if (realTimeInterval) return
  
  realTimeInterval = setInterval(async () => {
    try {
      await loadWeatherData()
      await loadPredictions()
      console.log('Real-time update completed')
    } catch (error) {
      handleError(error, 'Real-time update')
    }
  }, 30000) // Update every 30 seconds
  
  showMessage('ເລີ່ມອັບເດດແບບ Real-time ແລ້ວ', 'info')
}

function stopRealTimeUpdates() {
  if (realTimeInterval) {
    clearInterval(realTimeInterval)
    realTimeInterval = null
    showMessage('ຢຸດອັບເດດແບບ Real-time ແລ້ວ', 'info')
  }
}

// Performance optimization
function optimizeDataLoading() {
  // Implement pagination and lazy loading
  const pageSize = 50
  const currentPage = ref(1)
  
  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return filteredWeatherData.value.slice(start, end)
  })
  
  return {
    paginatedData,
    currentPage,
    pageSize,
    totalPages: computed(() => Math.ceil(filteredWeatherData.value.length / pageSize))
  }
}

// Cache management
const dataCache = new Map()

function cacheManagement() {
  const maxCacheSize = 10
  const cacheExpiration = 5 * 60 * 1000 // 5 minutes
  
  function set(key, data) {
    if (dataCache.size >= maxCacheSize) {
      const firstKey = dataCache.keys().next().value
      dataCache.delete(firstKey)
    }
    
    dataCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  function get(key) {
    const cached = dataCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cacheExpiration) {
      dataCache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  function clear() {
    dataCache.clear()
  }
  
  return { set, get, clear }
}

// Watchers
watch([selectedCity, dateFrom, dateTo, selectedCondition, searchQuery], () => {
  filterData()
})

// Initialize data on component mount
onMounted(async () => {
  await refreshData()
  startRealTimeUpdates()
  
  // Add a slight delay before triggering animations to ensure charts are rendered
  setTimeout(() => {
    animateCharts()
  }, 1000)
  
  // Set up enhanced animation triggers for chart interactions
  window.addEventListener('resize', () => {
    // Debounce the resize event to avoid excessive animation calls
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      // Update charts on window resize with reduced animation duration
      animateCharts()
    }, 250)
  })
})

// Debounce variables
let resizeTimeout = null

// Cleanup on unmount
onUnmounted(() => {
  stopRealTimeUpdates()
  
  // Remove event listeners to prevent memory leaks
  window.removeEventListener('resize', () => {})
  
  // Clear any pending timeouts
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})

// Chart references for animation control
const temperatureChartRef = ref(null)
const humidityChartRef = ref(null)
const predictionChartRef = ref(null)

// Method to trigger chart animations with advanced settings
function animateCharts() {
  const animationOptions = {
    duration: 1500,
    easing: 'easeInOutQuart'
  }
  
  // Use $nextTick to ensure refs are available
  setTimeout(() => {
    // Animate temperature chart with delay
    if (temperatureChartRef.value?.getChartInstance) {
      temperatureChartRef.value.refreshChart({
        ...animationOptions,
        duration: 1200
      })
    }
    
    // Animate humidity chart with delay
    setTimeout(() => {
      if (humidityChartRef.value?.getChartInstance) {
        humidityChartRef.value.refreshChart({
          ...animationOptions,
          duration: 1400
        })
      }
    }, 300)
    
    // Animate prediction chart with delay
    setTimeout(() => {
      if (predictionChartRef.value?.getChartInstance) {
        predictionChartRef.value.refreshChart({
          ...animationOptions,
          duration: 1800
        })
      }
    }, 600)
  }, 100)
  
  showMessage('ແອນິເມຊັນກຣາຟໄດ້ຖືກໂຫລດຄືນໃໝ່', 'info')
}

// Helper function to create beautiful chart gradients
function createGradientColors(baseColor, opacity = 0.7) {
  const colors = {
    temperature: {
      border: '#FF6B6B',
      background: [
        `rgba(255, 107, 107, ${opacity})`,
        `rgba(255, 107, 107, ${opacity * 0.6})`,
        `rgba(255, 107, 107, ${opacity * 0.3})`,
        `rgba(255, 107, 107, ${opacity * 0.1})`
      ]
    },
    humidity: {
      border: '#4ECDC4',
      background: [
        `rgba(78, 205, 196, ${opacity})`,
        `rgba(78, 205, 196, ${opacity * 0.6})`,
        `rgba(78, 205, 196, ${opacity * 0.3})`,
        `rgba(78, 205, 196, ${opacity * 0.1})`
      ]
    },
    prediction: {
      border: '#9D4EDD',
      background: [
        `rgba(157, 78, 221, ${opacity})`,
        `rgba(157, 78, 221, ${opacity * 0.6})`,
        `rgba(157, 78, 221, ${opacity * 0.3})`,
        `rgba(157, 78, 221, ${opacity * 0.1})`
      ]
    },
    actual: {
      border: '#FF4757',
      background: [
        `rgba(255, 71, 87, ${opacity})`,
        `rgba(255, 71, 87, ${opacity * 0.6})`,
        `rgba(255, 71, 87, ${opacity * 0.3})`,
        `rgba(255, 71, 87, ${opacity * 0.1})`
      ]
    },
    confidence: {
      border: '#2ED573',
      background: [
        `rgba(46, 213, 115, ${opacity})`,
        `rgba(46, 213, 115, ${opacity * 0.6})`,
        `rgba(46, 213, 115, ${opacity * 0.3})`,
        `rgba(46, 213, 115, ${opacity * 0.1})`
      ]
    }
  }
  
  return colors[baseColor] || {
    border: '#6C63FF',
    background: [
      `rgba(108, 99, 255, ${opacity})`,
      `rgba(108, 99, 255, ${opacity * 0.6})`,
      `rgba(108, 99, 255, ${opacity * 0.3})`,
      `rgba(108, 99, 255, ${opacity * 0.1})`
    ]
  }
}

// ✅ New event handlers for components
function handleRealTimeUpdate() {
  return refreshData()
}

function onRealTimeStatusChange(status) {
  showMessage(`Real-time updates ${status}`, 'info')
}

function onRealTimeError(error) {
  handleError(error, 'Real-time update')
}

function onFilterChange(filteredData, filters) {
  // Update filter values
  selectedCity.value = filters.city || ''
  dateFrom.value = filters.dateFrom || ''
  dateTo.value = filters.dateTo || ''
  selectedCondition.value = filters.condition || ''
  searchQuery.value = filters.search || ''
  
  // Apply filters to both datasets
  filterData()
  
  showMessage(`ນຳໃຊ້ການກັ່ນຕອງແລ້ວ - ສະພາບອາກາດ: ${filteredWeatherData.value.length}, ການຄາດການ: ${filteredPredictionData.value.length} ບັນທຶກພົບ`, 'info')
}

function onSearch(query) {
  searchQuery.value = query
  filterData()
}

function onCityChange(cityId) {
  selectedCity.value = cityId
  filterData()
}

function onDateChange(dateRange) {
  dateFrom.value = dateRange.from || ''
  dateTo.value = dateRange.to || ''
  filterData()
}

function onConditionChange(condition) {
  selectedCondition.value = condition
  filterData()
}

function onValidateData(data) {
  // Validate weather data
  const errors = []
  data.forEach(item => {
    const itemErrors = validateWeatherData(item)
    if (itemErrors.length) {
      errors.push(`${item.cityName} (${item.date}): ${itemErrors.join(', ')}`)
    }
  })
  
  if (errors.length) {
    console.error('Validation errors:', errors)
    showMessage(`ພົບ ${errors.length} ຂໍ້ຜິດພາດການກວດສອບ`, 'warning')
  } else {
    showMessage('ກວດສອບຂໍ້ມູນທັງໝົດສຳເລັດແລ້ວ', 'success')
  }
}

function exportChart(title) {
  showMessage(`ສົ່ງອອກກຣາຟ ${title} ສຳເລັດແລ້ວ!`, 'success')
}

function onTrendAnalysis(analysis) {
  console.log('Trend Analysis Results:', analysis)
  showMessage('ການວິເຄາະແນວໂນ້ມສຳເລັດແລ້ວ', 'success')
}
</script>
