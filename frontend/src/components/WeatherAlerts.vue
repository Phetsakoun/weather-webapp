<template>
  <div class="weather-alerts-container">
    <!-- Alert Popup Cards -->
    <transition-group 
      name="alert-slide" 
      tag="div" 
      class="fixed top-4 right-4 z-50 space-y-3 max-w-md"
    >
      <div
        v-for="alert in visibleAlerts"
        :key="alert.id"
        :class="[
          'weather-alert-card rounded-lg shadow-xl border-l-4 p-4 bg-white transform transition-all duration-300',
          alert.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
          getAlertBorderColor(alert.severity)
        ]"
      >
        <!-- Alert Header -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center">
            <v-icon 
              :color="alert.color" 
              :icon="alert.icon" 
              size="24" 
              class="mr-2"
            />
            <div>
              <h4 class="font-semibold text-gray-800 text-sm">{{ alert.title }}</h4>
              <p class="text-xs text-gray-500">{{ alert.cityName }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-1">
            <v-chip 
              :color="alert.color" 
              size="x-small" 
              class="text-xs"
            >
              {{ getSeverityText(alert.severity) }}
            </v-chip>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="dismissAlert(alert.id)"
              class="text-gray-400 hover:text-gray-600"
            />
          </div>
        </div>

        <!-- Alert Message -->
        <p class="text-sm text-gray-700 mb-3">{{ alert.message }}</p>

        <!-- Alert Value -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-lg" :class="getValueTextColor(alert.severity)">
              {{ alert.value }}{{ alert.unit }}
            </span>
            <span class="text-xs text-gray-500">
              {{ formatTime(alert.timestamp) }}
            </span>
          </div>
        </div>

        <!-- Recommendations (for critical alerts) -->
        <div v-if="alert.recommendations && alert.recommendations.length > 0" class="mt-3">
          <h5 class="text-xs font-semibold text-gray-700 mb-2">คำแนะนำ:</h5>
          <ul class="text-xs text-gray-600 space-y-1">
            <li 
              v-for="(rec, index) in alert.recommendations" 
              :key="index"
              class="flex items-start"
            >
              <span class="text-blue-500 mr-1">•</span>
              <span>{{ rec }}</span>
            </li>
          </ul>
        </div>

        <!-- Alert Actions -->
        <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <button
            @click="viewAlertDetails(alert)"
            class="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            ดูรายละเอียด
          </button>
          <div class="flex items-center space-x-2">
            <button
              @click="snoozeAlert(alert.id, 15)"
              class="text-xs text-gray-500 hover:text-gray-700"
              title="เลื่อนการแจ้งเตือน 15 นาที"
            >
              <v-icon size="14">mdi-clock-outline</v-icon>
              15น.
            </button>
            <button
              @click="dismissAlert(alert.id)"
              class="text-xs text-red-500 hover:text-red-700"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- Alert Settings Fab -->
    <v-btn
      icon="mdi-cog"
      color="primary"
      size="large"
      class="fixed bottom-6 right-6 z-40"
      @click="showSettings = true"
      v-if="!showSettings"
    />

    <!-- Alert Summary Badge -->
    <div 
      v-if="alerts.length > 0" 
      class="fixed top-4 left-4 z-50"
    >
      <v-chip 
        :color="getHighestSeverityColor()" 
        size="small"
        @click="showAllAlerts = !showAllAlerts"
        class="cursor-pointer"
      >
        <v-icon start size="16">mdi-alert</v-icon>
        {{ alerts.length }} การแจ้งเตือน
      </v-chip>
    </div>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-lg font-semibold">ตั้งค่าการแจ้งเตือนสภาพอากาศ</span>
        </v-card-title>
        <v-card-text>
          <div class="space-y-4">
            <!-- Enable/Disable Alerts -->
            <div>
              <v-switch 
                v-model="isAlertsEnabled" 
                label="เปิดใช้งานการแจ้งเตือน"
                @update:model-value="toggleAlerts"
                color="primary"
              />
            </div>

            <v-divider />

            <!-- Temperature Settings -->
            <div>
              <h4 class="text-md font-medium mb-3">เกณฑ์อุณหภูมิ (°C)</h4>
              <div class="grid grid-cols-2 gap-3">
                <v-text-field
                  v-model.number="tempSettings.veryHot"
                  label="อุณหภูมิสูงมาก"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="°C"
                />
                <v-text-field
                  v-model.number="tempSettings.hot"
                  label="อุณหภูมิสูง"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="°C"
                />
                <v-text-field
                  v-model.number="tempSettings.cold"
                  label="อุณหภูมิต่ำ"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="°C"
                />
                <v-text-field
                  v-model.number="tempSettings.veryCold"
                  label="อุณหภูมิต่ำมาก"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="°C"
                />
              </div>
            </div>

            <v-divider />

            <!-- Rainfall Settings -->
            <div>
              <h4 class="text-md font-medium mb-3">เกณฑ์ฝน (mm/ชั่วโมง)</h4>
              <div class="grid grid-cols-2 gap-3">
                <v-text-field
                  v-model.number="rainSettings.heavy"
                  label="ฝนหนัก"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="mm"
                />
                <v-text-field
                  v-model.number="rainSettings.veryHeavy"
                  label="ฝนหนักมาก"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="mm"
                />
                <v-text-field
                  v-model.number="rainSettings.extreme"
                  label="ฝนหนักที่สุด"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="mm"
                  class="col-span-2"
                />
              </div>
            </div>

            <v-divider />

            <!-- Wind Settings -->
            <div>
              <h4 class="text-md font-medium mb-3">เกณฑ์ลม (km/h)</h4>
              <div class="grid grid-cols-2 gap-3">
                <v-text-field
                  v-model.number="windSettings.strong"
                  label="ลมแรง"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="km/h"
                />
                <v-text-field
                  v-model.number="windSettings.veryStrong"
                  label="ลมแรงมาก"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="km/h"
                />
                <v-text-field
                  v-model.number="windSettings.extreme"
                  label="ลมแรงที่สุด"
                  type="number"
                  density="compact"
                  variant="outlined"
                  suffix="km/h"
                  class="col-span-2"
                />
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn 
            color="primary" 
            @click="saveSettings"
            prepend-icon="mdi-content-save"
          >
            บันทึก
          </v-btn>
          <v-btn 
            variant="text" 
            @click="showSettings = false"
          >
            ยกเลิก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Alert Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="600px">
      <v-card v-if="selectedAlert">
        <v-card-title class="d-flex align-center">
          <v-icon :color="selectedAlert.color" class="mr-2">
            {{ selectedAlert.icon }}
          </v-icon>
          <span>{{ selectedAlert.title }}</span>
          <v-spacer />
          <v-chip 
            :color="selectedAlert.color" 
            size="small"
          >
            {{ getSeverityText(selectedAlert.severity) }}
          </v-chip>
        </v-card-title>
        <v-card-text>
          <div class="space-y-4">
            <div>
              <h4 class="font-medium mb-2">รายละเอียด</h4>
              <p>{{ selectedAlert.message }}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h5 class="font-medium text-sm text-gray-600">เมือง</h5>
                <p>{{ selectedAlert.cityName }}</p>
              </div>
              <div>
                <h5 class="font-medium text-sm text-gray-600">ค่าที่วัดได้</h5>
                <p class="font-bold text-lg">{{ selectedAlert.value }}{{ selectedAlert.unit }}</p>
              </div>
              <div>
                <h5 class="font-medium text-sm text-gray-600">เวลา</h5>
                <p>{{ formatDateTime(selectedAlert.timestamp) }}</p>
              </div>
              <div>
                <h5 class="font-medium text-sm text-gray-600">ประเภท</h5>
                <p>{{ getTypeText(selectedAlert.type) }}</p>
              </div>
            </div>
            <div v-if="selectedAlert.recommendations && selectedAlert.recommendations.length > 0">
              <h4 class="font-medium mb-2">คำแนะนำ</h4>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li v-for="(rec, index) in selectedAlert.recommendations" :key="index">
                  {{ rec }}
                </li>
              </ul>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDetailsDialog = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Local state for weather alerts
const alerts = ref([])
const isAlertsEnabled = ref(true)

// Mock weather thresholds (สามารถปรับแต่งได้ตามต้องการ)
const WEATHER_THRESHOLDS = {
  temperature: { min: 15, max: 40 },
  humidity: { max: 85 },
  rainfall: { max: 50 },
  windSpeed: { max: 30 }
}

// Functions
const dismissAlert = (alertId) => {
  alerts.value = alerts.value.filter(alert => alert.id !== alertId)
}

const dismissAllAlerts = () => {
  alerts.value = []
}

const toggleAlerts = () => {
  isAlertsEnabled.value = !isAlertsEnabled.value
}

const updateThresholds = (newThresholds) => {
  Object.assign(WEATHER_THRESHOLDS, newThresholds)
}

// Local state
const showSettings = ref(false)
const showDetailsDialog = ref(false)
const selectedAlert = ref(null)
const showAllAlerts = ref(true)
const snoozedAlerts = ref(new Set())

// Settings
const tempSettings = ref({
  veryHot: WEATHER_THRESHOLDS.temperature.veryHot,
  hot: WEATHER_THRESHOLDS.temperature.hot,
  cold: WEATHER_THRESHOLDS.temperature.cold,
  veryCold: WEATHER_THRESHOLDS.temperature.veryCold
})

const rainSettings = ref({
  heavy: WEATHER_THRESHOLDS.rainfall.heavy,
  veryHeavy: WEATHER_THRESHOLDS.rainfall.veryHeavy,
  extreme: WEATHER_THRESHOLDS.rainfall.extreme
})

const windSettings = ref({
  strong: WEATHER_THRESHOLDS.windSpeed.strong,
  veryStrong: WEATHER_THRESHOLDS.windSpeed.veryStrong,
  extreme: WEATHER_THRESHOLDS.windSpeed.extreme
})

// Computed
const visibleAlerts = computed(() => {
  return alerts.value.filter(alert => 
    alert.isVisible && 
    !snoozedAlerts.value.has(alert.id) &&
    (showAllAlerts.value || alert.severity === 'critical')
  ).slice(0, 5) // แสดงสูงสุด 5 alerts
})

// Methods
const getAlertBorderColor = (severity) => {
  switch (severity) {
    case 'critical': return 'border-l-red-500'
    case 'warning': return 'border-l-yellow-500'
    case 'info': return 'border-l-blue-500'
    default: return 'border-l-gray-500'
  }
}

const getValueTextColor = (severity) => {
  switch (severity) {
    case 'critical': return 'text-red-600'
    case 'warning': return 'text-yellow-600'
    case 'info': return 'text-blue-600'
    default: return 'text-gray-600'
  }
}

const getSeverityText = (severity) => {
  switch (severity) {
    case 'critical': return 'วิกฤต'
    case 'warning': return 'เตือน'
    case 'info': return 'ข้อมูล'
    default: return 'ทั่วไป'
  }
}

const getTypeText = (type) => {
  switch (type) {
    case 'temperature': return 'อุณหภูมิ'
    case 'rainfall': return 'ปริมาณฝน'
    case 'wind': return 'ความเร็วลม'
    case 'humidity': return 'ความชื้น'
    default: return 'อื่นๆ'
  }
}

const getHighestSeverityColor = () => {
  const hasCritical = alerts.value.some(a => a.severity === 'critical')
  const hasWarning = alerts.value.some(a => a.severity === 'warning')
  
  if (hasCritical) return 'error'
  if (hasWarning) return 'warning'
  return 'info'
}

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewAlertDetails = (alert) => {
  selectedAlert.value = alert
  showDetailsDialog.value = true
}

const snoozeAlert = (alertId, minutes) => {
  snoozedAlerts.value.add(alertId)
  setTimeout(() => {
    snoozedAlerts.value.delete(alertId)
  }, minutes * 60 * 1000)
}

const saveSettings = () => {
  const newThresholds = {
    temperature: tempSettings.value,
    rainfall: rainSettings.value,
    windSpeed: windSettings.value
  }
  
  updateThresholds(newThresholds)
  showSettings.value = false
  
  // แสดงข้อความยืนยัน
  // สามารถเพิ่ม snackbar หรือ toast notification ได้
}

// Play sound for critical alerts
watch(alerts, (newAlerts, oldAlerts) => {
  const newCriticalAlerts = newAlerts.filter(alert => 
    alert.severity === 'critical' && 
    !oldAlerts.some(old => old.id === alert.id)
  )
  
  if (newCriticalAlerts.length > 0) {
    // เล่นเสียงแจ้งเตือน (optional)
    try {
      const audio = new Audio('/sounds/alert.mp3')
      audio.play().catch(e => console.log('Cannot play alert sound:', e))
    } catch (e) {
      console.log('Alert sound not available')
    }
  }
}, { deep: true })
</script>

<style scoped>
.weather-alerts-container {
  pointer-events: none;
}

.weather-alert-card {
  pointer-events: all;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.alert-slide-enter-active,
.alert-slide-leave-active {
  transition: all 0.3s ease;
}

.alert-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.alert-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.alert-slide-move {
  transition: transform 0.3s ease;
}
</style>
