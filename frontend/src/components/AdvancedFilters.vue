<template>
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Advanced Filters & Search</h3>
      <v-btn 
        color="warning" 
        @click="clearAllFilters" 
        prepend-icon="mdi-filter-remove"
        variant="outlined"
      >
        Clear All
      </v-btn>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <!-- City Filter -->
      <v-select
        v-model="filters.selectedCity"
        :items="cities"
        item-title="name"
        item-value="id"
        label="Select City"
        density="compact"
        variant="outlined"
        clearable
        @update:model-value="applyFilters"
      />
      
      <!-- Date Range -->
      <v-text-field
        v-model="filters.dateFrom"
        label="From Date"
        type="date"
        density="compact"
        variant="outlined"
        @update:model-value="applyFilters"
      />
      
      <v-text-field
        v-model="filters.dateTo"
        label="To Date"
        type="date"
        density="compact"
        variant="outlined"
        @update:model-value="applyFilters"
      />
      
      <!-- Temperature Range -->
      <div class="flex gap-2">
        <v-text-field
          v-model="filters.tempMin"
          label="Min Temp (°C)"
          type="number"
          density="compact"
          variant="outlined"
          @update:model-value="applyFilters"
        />
        <v-text-field
          v-model="filters.tempMax"
          label="Max Temp (°C)"
          type="number"
          density="compact"
          variant="outlined"
          @update:model-value="applyFilters"
        />
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <!-- Humidity Range -->
      <div class="flex gap-2">
        <v-text-field
          v-model="filters.humidityMin"
          label="Min Humidity (%)"
          type="number"
          density="compact"
          variant="outlined"
          @update:model-value="applyFilters"
        />
        <v-text-field
          v-model="filters.humidityMax"
          label="Max Humidity (%)"
          type="number"
          density="compact"
          variant="outlined"
          @update:model-value="applyFilters"
        />
      </div>
      
      <!-- Weather Condition -->
      <v-select
        v-model="filters.weatherCondition"
        :items="weatherConditions"
        label="Weather Condition"
        density="compact"
        variant="outlined"
        clearable
        @update:model-value="applyFilters"
      />
      
      <!-- Rainfall Range -->
      <div class="flex gap-2">
        <v-text-field
          v-model="filters.rainfallMin"
          label="Min Rainfall (mm)"
          type="number"
          density="compact"
          variant="outlined"
          @update:model-value="applyFilters"
        />
        <v-text-field
          v-model="filters.rainfallMax"
          label="Max Rainfall (mm)"
          type="number"
          density="compact"
          variant="outlined"
          @update:model-value="applyFilters"
        />
      </div>
      
      <!-- Search Query -->
      <v-text-field
        v-model="filters.searchQuery"
        label="Search..."
        density="compact"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        clearable
        @update:model-value="applyFilters"
        @keyup.enter="applyFilters"
      />
    </div>
    
    <!-- Quick Filter Buttons -->
    <div class="flex flex-wrap gap-2 mb-4">
      <v-btn 
        size="small" 
        @click="setQuickFilter('today')"
        :color="quickFilter === 'today' ? 'primary' : 'default'"
      >
        Today
      </v-btn>
      <v-btn 
        size="small" 
        @click="setQuickFilter('week')"
        :color="quickFilter === 'week' ? 'primary' : 'default'"
      >
        This Week
      </v-btn>
      <v-btn 
        size="small" 
        @click="setQuickFilter('month')"
        :color="quickFilter === 'month' ? 'primary' : 'default'"
      >
        This Month
      </v-btn>
      <v-btn 
        size="small" 
        @click="setQuickFilter('hot')"
        :color="quickFilter === 'hot' ? 'warning' : 'default'"
      >
        Hot Days (>30°C)
      </v-btn>
      <v-btn 
        size="small" 
        @click="setQuickFilter('rainy')"
        :color="quickFilter === 'rainy' ? 'info' : 'default'"
      >
        Rainy Days
      </v-btn>
      <v-btn 
        size="small" 
        @click="setQuickFilter('humid')"
        :color="quickFilter === 'humid' ? 'success' : 'default'"
      >
        High Humidity (>80%)
      </v-btn>
    </div>
    
    <!-- Filter Summary -->
    <div v-if="hasActiveFilters" class="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-blue-800">
          {{ activeFilterCount }} filter(s) active - {{ filteredCount }} results
        </span>
        <v-btn 
          size="small" 
          color="blue" 
          variant="text" 
          @click="saveFilterPreset"
          prepend-icon="mdi-content-save"
        >
          Save Preset
        </v-btn>
      </div>
    </div>
    
    <!-- Filter Presets -->
    <div v-if="filterPresets.length" class="mt-4">
      <h4 class="text-sm font-medium mb-2">Saved Presets:</h4>
      <div class="flex flex-wrap gap-2">
        <v-chip
          v-for="preset in filterPresets"
          :key="preset.id"
          @click="loadFilterPreset(preset)"
          color="purple"
          variant="outlined"
          closable
          @click:close="deleteFilterPreset(preset.id)"
        >
          {{ preset.name }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  cities: {
    type: Array,
    default: () => []
  },
  weatherConditions: {
    type: Array,
    default: () => []
  },
  data: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['filter-change', 'search'])

// Filter state
const filters = ref({
  selectedCity: '',
  dateFrom: '',
  dateTo: '',
  tempMin: '',
  tempMax: '',
  humidityMin: '',
  humidityMax: '',
  rainfallMin: '',
  rainfallMax: '',
  weatherCondition: '',
  searchQuery: ''
})

const quickFilter = ref('')
const filterPresets = ref([])

// Computed properties
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => value !== '' && value !== null)
})

const activeFilterCount = computed(() => {
  return Object.values(filters.value).filter(value => value !== '' && value !== null).length
})

const filteredCount = computed(() => {
  return applyFiltersToData().length
})

// Methods
function applyFilters() {
  const filteredData = applyFiltersToData()
  emit('filter-change', filteredData, filters.value)
}

function applyFiltersToData() {
  let filtered = [...props.data]
  
  // City filter
  if (filters.value.selectedCity) {
    filtered = filtered.filter(item => item.cityId === filters.value.selectedCity)
  }
  
  // Date range filter
  if (filters.value.dateFrom) {
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.date || item.prediction_date)
      return itemDate >= new Date(filters.value.dateFrom)
    })
  }
  
  if (filters.value.dateTo) {
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.date || item.prediction_date)
      return itemDate <= new Date(filters.value.dateTo)
    })
  }
  
  // Temperature range filter
  if (filters.value.tempMin) {
    filtered = filtered.filter(item => {
      const temp = item.temperature || item.predicted_temperature
      return temp >= parseFloat(filters.value.tempMin)
    })
  }
  
  if (filters.value.tempMax) {
    filtered = filtered.filter(item => {
      const temp = item.temperature || item.predicted_temperature
      return temp <= parseFloat(filters.value.tempMax)
    })
  }
  
  // Humidity range filter
  if (filters.value.humidityMin) {
    filtered = filtered.filter(item => {
      const humidity = item.humidity || item.predicted_humidity
      return humidity >= parseFloat(filters.value.humidityMin)
    })
  }
  
  if (filters.value.humidityMax) {
    filtered = filtered.filter(item => {
      const humidity = item.humidity || item.predicted_humidity
      return humidity <= parseFloat(filters.value.humidityMax)
    })
  }
  
  // Rainfall range filter
  if (filters.value.rainfallMin) {
    filtered = filtered.filter(item => (item.rainfall || 0) >= parseFloat(filters.value.rainfallMin))
  }
  
  if (filters.value.rainfallMax) {
    filtered = filtered.filter(item => (item.rainfall || 0) <= parseFloat(filters.value.rainfallMax))
  }
  
  // Weather condition filter
  if (filters.value.weatherCondition) {
    filtered = filtered.filter(item => item.weatherCondition === filters.value.weatherCondition)
  }
  
  // Search query filter
  if (filters.value.searchQuery) {
    const query = filters.value.searchQuery.toLowerCase()
    filtered = filtered.filter(item => 
      (item.cityName && item.cityName.toLowerCase().includes(query)) ||
      (item.date && item.date.includes(query)) ||
      (item.weatherCondition && item.weatherCondition.toLowerCase().includes(query))
    )
  }
  
  return filtered
}

function setQuickFilter(type) {
  clearAllFilters()
  quickFilter.value = type
  
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  switch (type) {
    case 'today':
      filters.value.dateFrom = todayStr
      filters.value.dateTo = todayStr
      break
      
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      filters.value.dateFrom = weekAgo.toISOString().split('T')[0]
      filters.value.dateTo = todayStr
      break
      
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setMonth(today.getMonth() - 1)
      filters.value.dateFrom = monthAgo.toISOString().split('T')[0]
      filters.value.dateTo = todayStr
      break
      
    case 'hot':
      filters.value.tempMin = '30'
      break
      
    case 'rainy':
      filters.value.rainfallMin = '1'
      break
      
    case 'humid':
      filters.value.humidityMin = '80'
      break
  }
  
  applyFilters()
}

function clearAllFilters() {
  filters.value = {
    selectedCity: '',
    dateFrom: '',
    dateTo: '',
    tempMin: '',
    tempMax: '',
    humidityMin: '',
    humidityMax: '',
    rainfallMin: '',
    rainfallMax: '',
    weatherCondition: '',
    searchQuery: ''
  }
  quickFilter.value = ''
  applyFilters()
}

function saveFilterPreset() {
  const name = prompt('Enter preset name:')
  if (name && name.trim()) {
    const preset = {
      id: Date.now(),
      name: name.trim(),
      filters: { ...filters.value }
    }
    filterPresets.value.push(preset)
    // Save to localStorage
    localStorage.setItem('weatherFilterPresets', JSON.stringify(filterPresets.value))
  }
}

function loadFilterPreset(preset) {
  filters.value = { ...preset.filters }
  quickFilter.value = ''
  applyFilters()
}

function deleteFilterPreset(id) {
  filterPresets.value = filterPresets.value.filter(preset => preset.id !== id)
  localStorage.setItem('weatherFilterPresets', JSON.stringify(filterPresets.value))
}

// Load saved presets on mount
function loadSavedPresets() {
  const saved = localStorage.getItem('weatherFilterPresets')
  if (saved) {
    try {
      filterPresets.value = JSON.parse(saved)
    } catch (error) {
      console.error('Error loading filter presets:', error)
    }
  }
}

// Initialize
loadSavedPresets()

// Watch for data changes
watch(() => props.data, () => {
  if (hasActiveFilters.value) {
    applyFilters()
  }
}, { deep: true })
</script>
