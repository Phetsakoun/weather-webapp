<!-- src/components/DisasterAlertPopup.vue -->
<template>
  <!-- Overlay Background -->
  <div 
    v-if="showPopup && activeAlert"
    class="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
    @click="closePopup"
  >
    <!-- Modal Container -->
    <div 
      class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
      @click.stop
    >
      <!-- Header with severity color -->
      <div 
        class="px-6 py-4 rounded-t-2xl flex items-center justify-between"
        :class="getHeaderClass(activeAlert.severity)"
      >
        <div class="flex items-center space-x-3">
          <div class="text-2xl">
            {{ getSeverityIcon(activeAlert.severity) }}
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">
              {{ getSeverityLabel(activeAlert.severity) }}
            </h3>
            <p class="text-sm text-white opacity-90">
              {{ formatTime(activeAlert.start_time) }}
            </p>
          </div>
        </div>
        <button 
          @click="closePopup"
          class="text-white hover:text-gray-200 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
        <h2 class="text-xl font-bold text-gray-900 mb-3 font-lao">
          {{ activeAlert.title }}
        </h2>
        <p class="text-gray-700 leading-relaxed mb-4 font-lao">
          {{ activeAlert.message }}
        </p>

        <!-- Recommendations if available -->
        <div v-if="activeAlert.recommendations && activeAlert.recommendations.length > 0" class="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 class="text-sm font-bold text-blue-900 mb-2 font-lao">
            📋 ຄຳແນະນຳ:
          </h4>
          <ul class="text-sm text-blue-800 space-y-1 font-lao">
            <li v-for="(rec, index) in activeAlert.recommendations" :key="index" class="flex items-start">
              <span class="text-blue-600 mr-2">•</span>
              <span>{{ rec }}</span>
            </li>
          </ul>
        </div>

        <!-- Time Info -->
        <div class="text-sm text-gray-500 mb-4 font-lao">
          <div class="flex items-center justify-between">
            <span>ເວລາເລີ່ມ: {{ formatTime(activeAlert.start_time) }}</span>
            <span v-if="activeAlert.end_time">ສິ້ນສຸດ: {{ formatTime(activeAlert.end_time) }}</span>
          </div>
        </div>

        <!-- Multiple alerts indicator -->
        <div v-if="alerts.length > 1" class="flex items-center justify-center space-x-2 mb-4">
          <button
            v-for="(alert, index) in alerts"
            :key="alert.id"
            @click="setActiveAlert(index)"
            class="w-2 h-2 rounded-full transition-colors"
            :class="currentAlertIndex === index ? 'bg-blue-500' : 'bg-gray-300'"
          />
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between items-center">
        <div class="text-sm text-gray-500 font-lao">
          {{ currentAlertIndex + 1 }} / {{ alerts.length }}
        </div>
        <div class="flex space-x-3">
          <button
            v-if="alerts.length > 1 && currentAlertIndex > 0"
            @click="prevAlert"
            class="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-lao"
          >
            ກ່ອນໜ້າ
          </button>
          <button
            v-if="alerts.length > 1 && currentAlertIndex < alerts.length - 1"
            @click="nextAlert"
            class="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-lao"
          >
            ຕໍ່ໄປ
          </button>
          <button
            @click="acknowledgeAndClose"
            class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-lao"
          >
            ✓ ຮັບຊາບ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DisasterAlertService from '@/services/disasterAlertService'

// Props
const props = defineProps({
  forceShow: {
    type: Boolean,
    default: false
  }
})

// State
const showPopup = ref(false)
const alerts = ref([])
const currentAlertIndex = ref(0)
const sessionAcknowledged = ref(new Set())

// Computed
const activeAlert = computed(() => {
  return alerts.value[currentAlertIndex.value] || null
})

// Methods
const fetchActiveNotifications = async () => {
  try {
    const activeAlerts = await DisasterAlertService.fetchActiveAlerts()
    
    if (activeAlerts.length > 0) {
      // Filter out already acknowledged alerts
      const filteredAlerts = activeAlerts.filter(alert => {
        return DisasterAlertService.shouldShowAlert(alert.id) && 
               !sessionAcknowledged.value.has(alert.id)
      })
      
      if (filteredAlerts.length > 0) {
        alerts.value = filteredAlerts.map(alert => DisasterAlertService.formatAlert(alert))
        currentAlertIndex.value = 0
        showPopup.value = true
      }
    }
  } catch (error) {
    console.error('Error fetching active notifications:', error)
  }
}

const getSeverityIcon = (severity) => {
  return DisasterAlertService.getSeverityIcon(severity)
}

const getSeverityLabel = (severity) => {
  return DisasterAlertService.getSeverityLabel(severity)
}

const getHeaderClass = (severity) => {
  return DisasterAlertService.getSeverityColor(severity)
}

const formatTime = (timeString) => {
  return DisasterAlertService.formatDateTime(timeString)
}

const setActiveAlert = (index) => {
  currentAlertIndex.value = index
}

const nextAlert = () => {
  if (currentAlertIndex.value < alerts.value.length - 1) {
    currentAlertIndex.value++
  }
}

const prevAlert = () => {
  if (currentAlertIndex.value > 0) {
    currentAlertIndex.value--
  }
}

const acknowledgeAndClose = async () => {
  if (activeAlert.value) {
    // Mark as acknowledged in session
    sessionAcknowledged.value.add(activeAlert.value.id)
    
    // Store in localStorage
    DisasterAlertService.markAsAcknowledged(activeAlert.value.id)
    
    // Send acknowledgment to server
    try {
      await DisasterAlertService.acknowledgeNotification(activeAlert.value.id)
    } catch (error) {
      console.error('Error acknowledging notification:', error)
    }
  }
  
  closePopup()
}

const closePopup = () => {
  showPopup.value = false
  alerts.value = []
  currentAlertIndex.value = 0
}

// Keyboard navigation
const handleKeyPress = (event) => {
  if (!showPopup.value) return
  
  switch (event.key) {
    case 'Escape':
      closePopup()
      break
    case 'ArrowRight':
      nextAlert()
      break
    case 'ArrowLeft':
      prevAlert()
      break
    case 'Enter':
      acknowledgeAndClose()
      break
  }
}

// Lifecycle
onMounted(() => {
  // Load acknowledged alerts from localStorage
  try {
    const acknowledgedAlerts = JSON.parse(localStorage.getItem('acknowledgedAlerts') || '[]')
    sessionAcknowledged.value = new Set(acknowledgedAlerts)
  } catch (error) {
    console.error('Error loading acknowledged alerts:', error)
  }
  
  // Clean up old acknowledged alerts
  DisasterAlertService.clearOldAcknowledged()
  
  // Fetch notifications immediately
  fetchActiveNotifications()
  
  // Set up periodic check every 30 seconds
  const intervalId = setInterval(fetchActiveNotifications, 30000)
  
  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyPress)
  
  // Clean up on unmount
  onUnmounted(() => {
    clearInterval(intervalId)
    document.removeEventListener('keydown', handleKeyPress)
  })
})

// Expose method for manual trigger
defineExpose({
  checkForAlerts: fetchActiveNotifications
})
</script>

<style scoped>
/* Fade in animation */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.fixed {
  animation: fadeIn 0.3s ease-out;
}

/* Responsive design */
@media (max-width: 640px) {
  .max-w-md {
    max-width: 90vw;
  }
}

/* Lao font support */
.font-lao {
  font-family: 'Noto Sans Lao', sans-serif;
}
</style>
