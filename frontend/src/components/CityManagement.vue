<template>
  <div class="bg-white rounded-xl shadow">
    <div class="p-6">
      <!-- Region Statistics -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center">
            <v-icon color="blue" class="mr-2">mdi-weather-snowy</v-icon>
            <div>
              <div class="text-sm text-blue-600">ພາກເໜືອ</div>
              <div class="text-2xl font-bold text-blue-800">{{ getRegionCount('North') }}</div>
              <div class="text-xs text-blue-500">{{ getRegionPercentage('North') }}% ຂອງທັງໝົດ</div>
            </div>
          </div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center">
            <v-icon color="green" class="mr-2">mdi-weather-partly-cloudy</v-icon>
            <div>
              <div class="text-sm text-green-600">ພາກກາງ</div>
              <div class="text-2xl font-bold text-green-800">{{ getRegionCount('Central') }}</div>
              <div class="text-xs text-green-500">{{ getRegionPercentage('Central') }}% ຂອງທັງໝົດ</div>
            </div>
          </div>
        </div>
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="flex items-center">
            <v-icon color="orange" class="mr-2">mdi-weather-sunny</v-icon>
            <div>
              <div class="text-sm text-orange-600">ພາກໃຕ້</div>
              <div class="text-2xl font-bold text-orange-800">{{ getRegionCount('South') }}</div>
              <div class="text-xs text-orange-500">{{ getRegionPercentage('South') }}% ຂອງທັງໝົດ</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filter Section -->
      <div class="mb-4">
        <div class="flex flex-col md:flex-row gap-4 mb-3">
          <v-text-field
            :model-value="searchQuery"
            @update:model-value="$emit('update:searchQuery', $event)"
            prepend-inner-icon="mdi-magnify"
            label="ຄົ້ນຫາຕາມຊື່"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="flex-1"
          />
          <v-select
            :model-value="statusFilter"
            @update:model-value="$emit('update:statusFilter', $event)"
            :items="statusFilterOptions"
            label="ກັ່ນຕອງຕາມສະຖານະ"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="w-48"
          />
          <v-select
            :model-value="regionFilter"
            @update:model-value="$emit('update:regionFilter', $event)"
            :items="regionFilterOptions"
            label="ກັ່ນຕອງຕາມພື້ນທີ່"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="w-48"
          />
          <v-btn 
            color="secondary" 
            prepend-icon="mdi-filter-off" 
            @click="$emit('clear-filters')"
            variant="outlined"
          >
            ລົບການກັ່ນຕອງ
          </v-btn>
        </div>
        
        <!-- Quick Filter Chips -->
        <div class="flex flex-wrap gap-2 mb-3">
          <v-chip
            v-for="region in regionOptions"
            :key="region"
            :color="regionFilter === region ? getRegionColor(region) : 'default'"
            :variant="regionFilter === region ? 'flat' : 'outlined'"
            size="small"
            clickable
            @click="$emit('toggle-region-filter', region)"
            prepend-icon="mdi-map-marker"
          >
            {{ getRegionText(region) }} ({{ getRegionCount(region) }})
          </v-chip>
        </div>
        
        <!-- Results Summary -->
        <div class="text-sm text-gray-600 flex items-center justify-between">
          <span>
            ສະແດງ {{ filteredCities.length }} ຈາກ {{ cities.length }} ທີ່ຕັ້ງ
            <span v-if="searchQuery || statusFilter || regionFilter" class="font-medium">
              (ຫຼັງການກັ່ນຕອງ)
            </span>
          </span>
          <div v-if="testingAllWeather || testingAllLSTM" class="flex items-center space-x-2">
            <v-progress-circular
              :size="20"
              :width="2"
              color="primary"
              indeterminate
            />
            <span class="text-sm font-medium">
              {{ testingAllWeather ? 'ກຳລັງທົດສອບ Weather APIs...' : 'ກຳລັງທົດສອບ LSTM Predictions...' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cities Table -->
      <v-data-table 
        :headers="headers" 
        :items="filteredCities" 
        class="elevation-0"
        :items-per-page="10"
        :loading="loading"
        loading-text="ກຳລັງໂຫຼດຂໍ້ມູນ..."
        :search="searchQuery"
        :sort-by="[{ key: 'name', order: 'asc' }]"
        :items-per-page-options="[5, 10, 25, 50, { value: -1, title: 'ທັງໝົດ' }]"
      >
        <template #item.provinceName="{ item }">
          <div class="text-sm">
            <v-chip size="small" color="primary" variant="outlined">
              {{ item.provinceName }}
            </v-chip>
          </div>
        </template>
        <template #item.coordinates="{ item }">
          <div class="text-sm">
            <div class="font-mono">
              {{ formatCoordinate(item.latitude || item.lat) }}, {{ formatCoordinate(item.longitude || item.lon) }}
            </div>
            <div class="text-xs text-gray-500">
              Lat: {{ formatCoordinate(item.latitude || item.lat) }}, Lon: {{ formatCoordinate(item.longitude || item.lon) }}
            </div>
          </div>
        </template>
        <template #item.region="{ item }">
          <v-chip 
            :color="getRegionColor(item.region)" 
            size="small"
            prepend-icon="mdi-map-marker"
          >
            {{ getRegionText(item.region) }}
          </v-chip>
        </template>
        <template #item.weatherData="{ item }">
          <div class="text-sm">
            <v-chip 
              v-if="item.hasWeatherData" 
              color="success" 
              size="small"
              prepend-icon="mdi-weather-partly-cloudy"
            >
              API Available
            </v-chip>
            <v-chip 
              v-else 
              color="warning" 
              size="small"
              prepend-icon="mdi-weather-cloudy-alert"
            >
              No Data
            </v-chip>
            <div class="mt-1 flex gap-1">
              <v-btn 
                size="x-small" 
                color="primary" 
                variant="outlined"
                @click="$emit('test-weather-api', item)"
                :loading="item.testingWeather"
                :disabled="!item.latitude || !item.longitude"
              >
                API
              </v-btn>
              <v-btn 
                size="x-small" 
                color="purple" 
                variant="outlined"
                @click="$emit('test-lstm-prediction', item)"
                :loading="item.testingLSTM"
                :disabled="!item.hasWeatherData"
              >
                LSTM
              </v-btn>
            </div>
          </div>
        </template>
        <template #item.status="{ item }">
          <v-chip 
            :color="item.status === 'active' ? 'success' : 'error'" 
            size="small"
            :prepend-icon="item.status === 'active' ? 'mdi-check-circle' : 'mdi-close-circle'"
          >
            {{ item.status === 'active' ? 'ເປີດໃຊ້' : 'ປິດໃຊ້' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <div class="flex gap-1">
            <v-btn 
              :icon="item.status === 'active' ? 'mdi-eye-off' : 'mdi-eye'" 
              size="small" 
              :color="item.status === 'active' ? 'warning' : 'success'"
              @click="toggleCityStatus(item)" 
              :loading="item.updatingStatus"
              :title="item.status === 'active' ? 'ປິດການໃຊ້ງານ' : 'ເປີດການໃຊ້ງານ'"
            />
            <v-btn 
              icon="mdi-pencil" 
              size="small" 
              color="primary" 
              @click="$emit('edit-city', item)" 
            />
            <v-btn 
              icon="mdi-delete" 
              size="small" 
              color="error" 
              @click="$emit('delete-city', item)"
            />
          </div>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  cities: {
    type: Array,
    default: () => []
  },
  filteredCities: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  },
  statusFilter: {
    type: String,
    default: ''
  },
  regionFilter: {
    type: String,
    default: ''
  },
  testingAllWeather: {
    type: Boolean,
    default: false
  },
  testingAllLSTM: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'filter-cities',
  'clear-filters',
  'toggle-region-filter',
  'edit-city',
  'delete-city',
  'test-weather-api',
  'test-lstm-prediction',
  'toggle-city-status',
  'update:searchQuery',
  'update:statusFilter',
  'update:regionFilter'
])

const headers = [
  { title: 'ຊື່', key: 'name', sortable: true },
  { title: 'ແຂວງ', key: 'provinceName', sortable: true },
  { title: 'ພື້ນທີ່', key: 'region', sortable: true },
  { title: 'ພິກັດ', key: 'coordinates', sortable: false },
  { title: 'ຂໍ້ມູນອາກາດ', key: 'weatherData', sortable: false },
  { title: 'ສະຖານະ', key: 'status', sortable: true },
  { title: 'ການດຳເນີນການ', key: 'actions', sortable: false }
]

const regionOptions = ['North', 'Central', 'South']
const statusFilterOptions = [
  { title: 'ສະຖານະທັງໝົດ', value: '' },
  { title: 'ເປີດນຳໃຊ້', value: 'active' },
  { title: 'ປິດນຳໃຊ້', value: 'inactive' }
]
const regionFilterOptions = [
  { title: 'ທຸກພື້ນທີ່', value: '' },
  { title: 'ພາກເໜືອ', value: 'North' },
  { title: 'ພາກກາງ', value: 'Central' },
  { title: 'ພາກໃຕ້', value: 'South' }
]

// Functions
function toggleCityStatus(city) {
  emit('toggle-city-status', city)
}

// Helper functions
function getRegionCount(region) {
  return props.cities.filter(city => city.region === region).length
}

function getRegionPercentage(region) {
  if (props.cities.length === 0) return 0
  return Math.round((getRegionCount(region) / props.cities.length) * 100)
}

function formatCoordinate(coord) {
  if (coord === null || coord === undefined || isNaN(coord)) return '0.0000'
  return parseFloat(coord).toFixed(4)
}

function getRegionColor(region) {
  switch(region) {
    case 'North': return 'blue'
    case 'Central': return 'green'
    case 'South': return 'orange'
    default: return 'grey'
  }
}

function getRegionText(region) {
  switch(region) {
    case 'North': return 'ພາກເໜືອ'
    case 'Central': return 'ພາກກາງ'
    case 'South': return 'ພາກໃຕ້'
    default: return region
  }
}
</script>
