<template>
  <div class="bg-white rounded-xl shadow p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Real-Time Updates</h3>
      <div class="flex items-center gap-2">
        <v-switch
          v-model="isRealTimeEnabled"
          @change="toggleRealTime"
          color="success"
          label="Auto Refresh"
          density="compact"
        />
        <v-chip 
          :color="connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'error'"
          size="small"
        >
          {{ connectionStatus.toUpperCase() }}
        </v-chip>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Update Interval -->
      <v-select
        v-model="updateInterval"
        :items="intervalOptions"
        label="Update Interval"
        density="compact"
        variant="outlined"
        @update:model-value="updateIntervalChanged"
      />
      
      <!-- Last Update -->
      <div class="flex items-center p-3 bg-gray-50 rounded">
        <v-icon color="info" class="mr-2">mdi-clock</v-icon>
        <div>
          <div class="text-sm text-gray-600">Last Update</div>
          <div class="font-medium">{{ lastUpdateTime }}</div>
        </div>
      </div>
      
      <!-- Update Counter -->
      <div class="flex items-center p-3 bg-gray-50 rounded">
        <v-icon color="primary" class="mr-2">mdi-counter</v-icon>
        <div>
          <div class="text-sm text-gray-600">Updates Today</div>
          <div class="font-medium">{{ updateCount }}</div>
        </div>
      </div>
    </div>
    
    <!-- Update Log -->
    <div class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-medium">Update Log</h4>
        <v-btn 
          size="small" 
          @click="clearUpdateLog" 
          prepend-icon="mdi-delete"
          variant="text"
        >
          Clear
        </v-btn>
      </div>
      
      <div class="max-h-32 overflow-y-auto space-y-1">
        <div 
          v-for="log in updateLog" 
          :key="log.id"
          class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
        >
          <span>{{ log.message }}</span>
          <span class="text-gray-500">{{ formatTime(log.timestamp) }}</span>
        </div>
        
        <div v-if="!updateLog.length" class="text-center text-gray-500 py-4">
          No updates yet
        </div>
      </div>
    </div>
    
    <!-- Performance Metrics -->
    <div class="mt-4 p-3 bg-blue-50 rounded">
      <h4 class="font-medium mb-2">Performance Metrics</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div class="text-gray-600">Avg Update Time</div>
          <div class="font-medium">{{ avgUpdateTime }}ms</div>
        </div>
        <div>
          <div class="text-gray-600">Cache Hit Rate</div>
          <div class="font-medium">{{ cacheHitRate }}%</div>
        </div>
        <div>
          <div class="text-gray-600">Data Size</div>
          <div class="font-medium">{{ dataSize }}KB</div>
        </div>
        <div>
          <div class="text-gray-600">Memory Usage</div>
          <div class="font-medium">{{ memoryUsage }}MB</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  onUpdate: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['status-change', 'error'])

// State
const isRealTimeEnabled = ref(false)
const connectionStatus = ref('disconnected')
const updateInterval = ref(30000) // 30 seconds
const lastUpdateTime = ref('')
const updateCount = ref(0)
const updateLog = ref([])

// Performance metrics
const avgUpdateTime = ref(0)
const cacheHitRate = ref(0)
const dataSize = ref(0)
const memoryUsage = ref(0)

// Internal state
let realTimeInterval = null
let updateTimes = []
let cacheHits = 0
let totalRequests = 0

// Options
const intervalOptions = [
  { title: '10 seconds', value: 10000 },
  { title: '30 seconds', value: 30000 },
  { title: '1 minute', value: 60000 },
  { title: '5 minutes', value: 300000 },
  { title: '10 minutes', value: 600000 }
]

// Computed
const formattedInterval = computed(() => {
  const option = intervalOptions.find(opt => opt.value === updateInterval.value)
  return option ? option.title : 'Custom'
})

// Methods
function toggleRealTime() {
  if (isRealTimeEnabled.value) {
    startRealTimeUpdates()
  } else {
    stopRealTimeUpdates()
  }
}

function startRealTimeUpdates() {
  if (realTimeInterval) return
  
  connectionStatus.value = 'connecting'
  
  // Simulate connection delay
  setTimeout(() => {
    connectionStatus.value = 'connected'
    addToLog('Real-time updates started')
    
    realTimeInterval = setInterval(async () => {
      await performUpdate()
    }, updateInterval.value)
    
    emit('status-change', 'started')
  }, 1000)
}

function stopRealTimeUpdates() {
  if (realTimeInterval) {
    clearInterval(realTimeInterval)
    realTimeInterval = null
  }
  
  connectionStatus.value = 'disconnected'
  addToLog('Real-time updates stopped')
  emit('status-change', 'stopped')
}

async function performUpdate() {
  const startTime = Date.now()
  
  try {
    connectionStatus.value = 'updating'
    
    // Call the update function
    await props.onUpdate()
    
    const endTime = Date.now()
    const updateTime = endTime - startTime
    
    // Track performance
    updateTimes.push(updateTime)
    if (updateTimes.length > 10) {
      updateTimes.shift() // Keep only last 10 measurements
    }
    
    totalRequests++
    updateCount.value++
    
    // Calculate average update time
    avgUpdateTime.value = Math.round(
      updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length
    )
    
    // Update cache hit rate
    cacheHitRate.value = Math.round((cacheHits / totalRequests) * 100)
    
    // Update timestamps
    lastUpdateTime.value = new Date().toLocaleTimeString()
    
    // Add to log
    addToLog(`Data updated successfully (${updateTime}ms)`)
    
    connectionStatus.value = 'connected'
    
    // Update performance metrics
    updatePerformanceMetrics()
    
  } catch (error) {
    console.error('Real-time update error:', error)
    addToLog(`Update failed: ${error.message}`, 'error')
    emit('error', error)
    connectionStatus.value = 'error'
  }
}

function updateIntervalChanged() {
  if (isRealTimeEnabled.value) {
    stopRealTimeUpdates()
    startRealTimeUpdates()
  }
  addToLog(`Update interval changed to ${formattedInterval.value}`)
}

function addToLog(message, type = 'info') {
  const logEntry = {
    id: Date.now(),
    message,
    type,
    timestamp: new Date()
  }
  
  updateLog.value.unshift(logEntry)
  
  // Keep only last 20 entries
  if (updateLog.value.length > 20) {
    updateLog.value.pop()
  }
}

function clearUpdateLog() {
  updateLog.value = []
}

function formatTime(timestamp) {
  return timestamp.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function updatePerformanceMetrics() {
  // Simulate data size calculation
  dataSize.value = Math.round(Math.random() * 100 + 50)
  
  // Simulate memory usage (in a real app, you'd use performance.memory)
  if (performance.memory) {
    memoryUsage.value = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
  } else {
    memoryUsage.value = Math.round(Math.random() * 10 + 5)
  }
  
  // Simulate cache hit (randomly for demo)
  if (Math.random() > 0.3) {
    cacheHits++
  }
}

// Lifecycle
onMounted(() => {
  // Initialize performance metrics
  updatePerformanceMetrics()
  
  // Load saved settings
  const savedSettings = localStorage.getItem('realTimeSettings')
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings)
      updateInterval.value = settings.interval || 30000
      isRealTimeEnabled.value = settings.enabled || false
      
      if (isRealTimeEnabled.value) {
        startRealTimeUpdates()
      }
    } catch (error) {
      console.error('Error loading real-time settings:', error)
    }
  }
})

onUnmounted(() => {
  stopRealTimeUpdates()
  
  // Save settings
  const settings = {
    interval: updateInterval.value,
    enabled: isRealTimeEnabled.value
  }
  localStorage.setItem('realTimeSettings', JSON.stringify(settings))
})

// Watch for changes and save settings
watch([updateInterval, isRealTimeEnabled], () => {
  const settings = {
    interval: updateInterval.value,
    enabled: isRealTimeEnabled.value
  }
  localStorage.setItem('realTimeSettings', JSON.stringify(settings))
}, { deep: true })
</script>
