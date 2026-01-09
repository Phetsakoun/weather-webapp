<template>
  <div class="min-h-screen bg-[#f4f7fa] p-6">
    <!-- Header -->
    <div class="bg-white shadow px-6 py-4 flex items-center justify-between rounded-xl mb-6">
      <div class="flex items-center">
        <div class="bg-orange-100 rounded-lg p-3 mr-4">
          <v-icon size="28" color="orange">mdi-bell-alert</v-icon>
        </div>
        <div>
          <div class="text-xs text-gray-400">ຜູ້ຄຸ້ມຄອງ / ການຈັດການແຈງການ</div>
          <div class="text-2xl font-bold text-blue-900">ຈັດການແຈ້ງເຕືອນສະພາບອາກາດ</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <v-btn color="secondary" prepend-icon="mdi-refresh" @click="refreshData">
          ໂຫຼດຂໍ້ມູນໃໝ່
        </v-btn>
      </div>
    </div>

    <!-- Manual Notification Section -->
    <div class="bg-white rounded-xl shadow mb-6">
      <div class="p-6">
        <div class="flex items-center mb-4">
          <div class="bg-green-100 rounded-lg p-3 mr-4">
            <v-icon size="28" color="green">mdi-plus-circle</v-icon>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">ສ້າງການແຈ້ງເຕືອນ</h2>
            <p class="text-gray-600">ສ້າງການແຈ້ງເຕືອນໃໝ່ໂດຍກໍານົດເນື້ອຫາເອງ</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <v-text-field
            v-model="newNotification.title"
            label="ຫົວຂໍ້ແຈ້ງເຕືອນ"
            placeholder="ເຊັ່ນ: ແຈ້ງເຕືອນຝົນຕົກໜັກ"
            variant="outlined"
            prepend-inner-icon="mdi-format-title"
          />
          
          <div class="grid grid-cols-2 gap-4">
            <v-select
              v-model="newNotification.type"
              :items="notificationTypes"
              label="ປະເພດແຈ້ງເຕືອນ"
              variant="outlined"
              prepend-inner-icon="mdi-tag"
            />
            <v-select
              v-model="newNotification.severity"
              :items="severityLevels"
              label="ລະດັບຄວາມຮຸນແຮງ"
              variant="outlined"
              prepend-inner-icon="mdi-alert"
            />
          </div>
        </div>
        
        <v-textarea
          v-model="newNotification.message"
          label="ຂໍ້ຄວາມແຈ້ງເຕືອນ"
          placeholder="ເຊັ່ນ: ພະຍາກອນຝົນຕົກໜັກໃນພື້ນທີ່..."
          variant="outlined"
          rows="3"
          prepend-inner-icon="mdi-message-text"
          class="mt-4"
        />
        
        <v-textarea
          v-model="newNotification.recommendations"
          label="ຄຳແນະນຳ (ແຍກແຕ່ລະຂໍ້ດ້ວຍການຂື້ນບັນທັດໃໝ່)"
          placeholder="ເຊັ່ນ: ກະລຸນາລະມັດລະວັງ&#10;ຫຼີກເວັ້ນການເດີນທາງ&#10;ຕິດຕາມຂ່າວສານ"
          variant="outlined"
          rows="3"
          prepend-inner-icon="mdi-format-list-bulleted"
          class="mt-4"
        />
        
        <div class="flex justify-end space-x-2 mt-4">
          <v-btn color="secondary" variant="text" @click="clearNotificationForm">
            ລ້າງຟອມ
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated" 
            prepend-icon="mdi-plus"
            @click="createManualNotification"
            :disabled="!isValidNotification"
          >
            ສ້າງແຈ້ງເຕືອນ
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Notifications History -->
    <div class="bg-white rounded-xl shadow">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <div class="bg-purple-100 rounded-lg p-3 mr-4">
              <v-icon size="28" color="purple">mdi-history</v-icon>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">ປະຫວັດການແຈ້ງເຕືອນ</h2>
              <p class="text-gray-600">ລາຍການແຈ້ງເຕືອນທັງໝົດທີ່ເຄີຍສົ່ງ</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <v-btn 
              color="success" 
              prepend-icon="mdi-download"
              @click="exportNotifications"
              :disabled="notifications.length === 0"
            >
              Export ຂໍ້ມູນ
            </v-btn>
            <v-btn 
              color="error" 
              prepend-icon="mdi-delete-sweep"
              @click="deleteAllNotifications"
              :disabled="notifications.length === 0"
            >
              ລຶບທັງໝົດ
            </v-btn>
          </div>
        </div>
        
        <!-- Filter Section -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <v-text-field
              v-model="dateFilter.startDate"
              label="ວັນທີ່ເລີ່ມຕົ້ນ"
              type="date"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar-start"
            />
            <v-text-field
              v-model="dateFilter.endDate"
              label="ວັນທີ່ສິ້ນສຸດ"
              type="date"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar-end"
            />
            <v-select
              v-model="typeFilter"
              :items="filterTypes"
              label="ກັ່ນຕອງປະເພດ"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-filter"
              clearable
            />
            <v-select
              v-model="severityFilter"
              :items="filterSeverities"
              label="ກັ່ນຕອງລະດັບ"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-filter-variant"
              clearable
            />
          </div>
          <div class="flex justify-end space-x-2 mt-2">
            <v-btn 
              color="secondary" 
              variant="text" 
              @click="clearFilters"
            >
              ລ້າງການກັ່ນຕອງ
            </v-btn>
            <v-btn 
              color="primary" 
              prepend-icon="mdi-magnify"
              @click="applyFilters"
            >
              ປະຕິບັດການກັ່ນຕອງ
            </v-btn>
          </div>
        </div>
        
        <v-data-table
          :headers="notificationHeaders"
          :items="filteredNotifications"
          class="elevation-0"
          :items-per-page="10"
          no-data-text="ບໍ່ມີຂໍ້ມູນການແຈ້ງເຕືອນ"
          :loading="isLoading"
          loading-text="ກຳລັງໂຫຼດ..."
        >
          <template #item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>
          
          <template #item.type="{ item }">
            <v-chip :color="getTypeColor(item.type)" size="small">
              {{ getTypeLabel(item.type) }}
            </v-chip>
          </template>
          
          <template #item.severity="{ item }">
            <v-chip :color="getSeverityColor(item.severity)" size="small">
              {{ getSeverityLabel(item.severity) }}
            </v-chip>
          </template>
          
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ getStatusLabel(item.status) }}
            </v-chip>
          </template>
          
          <template #item.recipient_count="{ item }">
            {{ item.recipient_count || 0 }}
          </template>
          
          <template #item.actions="{ item }">
            <v-btn
              color="success"
              variant="text"
              icon="mdi-send"
              size="small"
              @click="broadcastNotification(item)"
              :disabled="item.status === 'sent'"
              title="ສົ່ງແຈ້ງເຕືອນ"
            />
            <v-btn
              color="error"
              variant="text"
              icon="mdi-delete"
              size="small"
              @click="deleteNotification(item.id)"
              title="ລຶບແຈ້ງເຕືອນ"
            />
          </template>
        </v-data-table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { showNotification } from '@/services/notificationService'
import api from '@/plugins/axios'

export default {
  name: 'NotificationManagement',
  setup() {
    // State
    const notifications = ref([])
    const weatherAlerts = ref([])
    const isLoading = ref(false)
    const isComponentMounted = ref(true)
    
    // Filter states
    const dateFilter = reactive({
      startDate: '',
      endDate: ''
    })
    const typeFilter = ref('')
    const severityFilter = ref('')
    
    const alertStats = ref({
      total: 0,
      today: 0
    })
    
    const newNotification = reactive({
      title: '',
      message: '',
      type: 'weather',
      severity: 'medium',
      recommendations: ''
    })

    // Data for UI components
    const notificationTypes = [
      { title: 'ອາກາດທົ່ວໄປ', value: 'weather' },
      { title: 'ຝົນ', value: 'rain' },
      { title: 'ພະຍຸ', value: 'storm' },
      { title: 'ໄພແລ້ງ', value: 'drought' },
      { title: 'ນ້ໍາຖ້ວມ', value: 'flood' },
      { title: 'ເຫດຉຸກເຉີນ', value: 'emergency' }
    ]

    const severityLevels = [
      { title: 'ຕ່ໍາ', value: 'low' },
      { title: 'ກາງ', value: 'medium' },
      { title: 'ສູງ', value: 'high' },
      { title: 'ວິກິດ', value: 'critical' }
    ]

    // Filter options
    const filterTypes = [
      { title: 'ທັງໝົດ', value: '' },
      { title: 'ອາກາດທົ່ວໄປ', value: 'weather' },
      { title: 'ຝົນ', value: 'rain' },
      { title: 'ພະຍຸ', value: 'storm' },
      { title: 'ໄພແລ້ງ', value: 'drought' },
      { title: 'ນ້ໍາຖ້ວມ', value: 'flood' },
      { title: 'ເຫດຉຸກເຉີນ', value: 'emergency' },
      { title: 'ດ້ວຍມື', value: 'Manual' },
      { title: 'ລະບົບ', value: 'System' }
    ]

    const filterSeverities = [
      { title: 'ທັງໝົດ', value: '' },
      { title: 'ຕ່ໍາ', value: 'low' },
      { title: 'ກາງ', value: 'medium' },
      { title: 'ສູງ', value: 'high' },
      { title: 'ວິກິດ', value: 'critical' }
    ]

    const notificationHeaders = [
      { title: 'ວັນທີ', key: 'created_at' },
      { title: 'ຫົວຂໍ້', key: 'title' },
      { title: 'ປະເພດ', key: 'type' },
      { title: 'ລະດັບ', key: 'severity' },
      { title: 'ສະຖານະ', key: 'status' },
      { title: 'ຈໍານວນຜູ້ຮັບ', key: 'recipient_count' },
      { title: 'ການດໍາເນີນການ', key: 'actions', sortable: false }
    ]

    // Computed
    const isValidNotification = computed(() => {
      return newNotification.title.trim() && newNotification.message.trim()
    })

    const filteredNotifications = computed(() => {
      let filtered = [...notifications.value]

      // Filter by date range
      if (dateFilter.startDate) {
        const startDate = new Date(dateFilter.startDate)
        filtered = filtered.filter(n => {
          const notificationDate = new Date(n.created_at)
          return notificationDate >= startDate
        })
      }

      if (dateFilter.endDate) {
        const endDate = new Date(dateFilter.endDate)
        endDate.setHours(23, 59, 59, 999) // End of day
        filtered = filtered.filter(n => {
          const notificationDate = new Date(n.created_at)
          return notificationDate <= endDate
        })
      }

      // Filter by type
      if (typeFilter.value) {
        filtered = filtered.filter(n => n.type === typeFilter.value)
      }

      // Filter by severity
      if (severityFilter.value) {
        filtered = filtered.filter(n => n.severity === severityFilter.value)
      }

      return filtered
    })

    // Methods
    const formatTime = (datetime) => {
      if (!datetime) return 'ບໍ່ລະບຸ'
      return new Date(datetime).toLocaleString('lo-LA')
    }

    const formatDate = (datetime) => {
      if (!datetime) return 'ບໍ່ລະບຸ'
      return new Date(datetime).toLocaleDateString('lo-LA')
    }

    const getTypeLabel = (type) => {
      const labels = {
        weather: 'ອາກາດທົ່ວໄປ',
        rain: 'ຝົນ',
        storm: 'ພະຍຸ',
        drought: 'ໄພແລ້ງ',
        flood: 'ນ້ໍາຖ້ວມ',
        emergency: 'ເຫດຉຸກເຉີນ',
        Weather: 'ອາກາດ',
        Manual: 'ດ້ວຍມື',
        System: 'ລະບົບ'
      }
      return labels[type] || type
    }

    const getSeverityLabel = (severity) => {
      const labels = {
        low: 'ຕ່ໍາ',
        medium: 'ກາງ',
        high: 'ສູງ',
        critical: 'ວິກິດ'
      }
      return labels[severity] || severity
    }

    const getStatusLabel = (status) => {
      const labels = {
        draft: 'ແບບຮ່າງ',
        sent: 'ສົ່ງແລ້ວ',
        failed: 'ສົ່ງບໍ່ສໍາເລັດ'
      }
      return labels[status] || status
    }

    // Color helper functions for UI
    const getAlertBorderClass = (severity) => {
      const classes = {
        low: 'border-l-green-500',
        medium: 'border-l-yellow-500',
        high: 'border-l-orange-500',
        critical: 'border-l-red-500'
      }
      return classes[severity] || 'border-l-blue-500'
    }

    const getSeverityColor = (severity) => {
      const colors = {
        low: 'success',
        medium: 'warning',
        high: 'orange',
        critical: 'error'
      }
      return colors[severity] || 'primary'
    }

    const getTypeColor = (type) => {
      const colors = {
        weather: 'blue',
        rain: 'green',
        storm: 'red',
        drought: 'orange',
        flood: 'teal',
        emergency: 'purple'
      }
      return colors[type] || 'primary'
    }

    const getStatusColor = (status) => {
      const colors = {
        draft: 'grey',
        sent: 'success',
        failed: 'error'
      }
      return colors[status] || 'primary'
    }

    const checkWeatherAnomalies = async () => {
      try {
        const response = await api.get('/api/weather/current-alerts')
        if (response.data.success && response.data.data) {
          // Convert weather data to alerts format
          const alerts = response.data.data.map(weather => ({
            id: `weather_${weather.id}`,
            type: 'ອາກາດ',
            message: `ອຸນຫະພູມ: ${weather.temperature}°C, ຝົນ: ${weather.rainfall}mm, ຄວາມຊື້ນ: ${weather.humidity}%`,
            severity: weather.temperature > 40 || weather.rainfall > 50 ? 'high' : 'low',
            location: weather.city?.name || weather.weatherCity?.name || 'ບໍ່ທຮາບ',
            probability: weather.temperature > 40 || weather.rainfall > 50 ? 85 : 30,
            created_at: weather.timestamp
          }))
          
          weatherAlerts.value = alerts
          await updateAlertStats()
        }
      } catch (error) {
        console.error('Error checking weather anomalies:', error)
        // Set empty alerts if error
        weatherAlerts.value = []
      }
    }

    const updateAlertStats = async () => {
      try {
        const response = await api.get('/api/notifications/count')
        if (response.data.count !== undefined) {
          alertStats.value = {
            total: response.data.count,
            today: Math.floor(response.data.count / 2) // Approximate today's count
          }
        }
      } catch (error) {
        console.error('Error updating alert stats:', error)
        // Set default stats if error
        alertStats.value = {
          total: weatherAlerts.value.length,
          today: Math.floor(weatherAlerts.value.length / 2)
        }
      }
    }

    const createWeatherNotification = async (alert) => {
      try {
        const notificationData = {
          type: 'Weather',
          title: `ແຈ້ງເຕືອນ${alert.type}`,
          message: alert.message,
          priority: alert.severity === 'high' ? 'High' : 'Medium'
        }

        const response = await api.post('/api/notifications', notificationData)
        if (response.data.success) {
          await loadNotifications()
          showNotification({
            type: 'success',
            title: 'ສຳເລັດ',
            message: 'ສ້າງແຈ້ງເຕືອນສຳເລັດ'
          })
        }
      } catch (error) {
        console.error('Error creating weather notification:', error)
        showNotification({
          type: 'error',
          title: 'ຂໍ້ຜິດພາດ',
          message: 'ບໍ່ສາມາດສ້າງແຈ້ງເຕືອນໄດ້'
        })
      }
    }

    const createManualNotification = async () => {
      try {
        const response = await api.post('/api/notifications', {
          type: 'Manual',
          title: newNotification.title,
          message: newNotification.message,
          recommendations: newNotification.recommendations,
          priority: newNotification.severity === 'critical' ? 'Critical' : 
                   newNotification.severity === 'high' ? 'High' : 
                   newNotification.severity === 'low' ? 'Low' : 'Medium'
        })
        
        if (response.data.success) {
          await loadNotifications()
          clearNotificationForm()
          showNotification({
            type: 'success',
            title: 'ສຳເລັດ',
            message: 'ສ້າງແຈ້ງເຕືອນສຳເລັດ'
          })
        }
      } catch (error) {
        console.error('Error creating manual notification:', error)
        showNotification({
          type: 'error',
          title: 'ຂໍ້ຜິດພາດ',
          message: 'ບໍ່ສາມາດສ້າງແຈ້ງເຕືອນໄດ້'
        })
      }
    }

    const broadcastNotification = async (notification) => {
      try {
        // Call the real broadcast endpoint
        const response = await api.post('/api/notifications/broadcast', {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority || 'medium'
        })
        
        if (response.data.success) {
          showNotification({
            type: 'success',
            title: 'ສຳເລັດ',
            message: `ສົ່ງແຈ້ງເຕືອນສຳເລັດ (ສົ່ງຖຶງ ${response.data.data.estimatedReach} ຄົນ)`
          })
          
          // Update notification status locally
          const index = notifications.value.findIndex(n => n.id === notification.id)
          if (index !== -1) {
            notifications.value[index].status = 'sent'
          }
        }
      } catch (error) {
        console.error('Error broadcasting notification:', error)
        showNotification({
          type: 'error',
          title: 'ຂໍ້ຜິດພາດ',
          message: 'ບໍ່ສາມາດສົ່ງແຈ້ງເຕືອນໄດ້'
        })
      }
    }

    const deleteNotification = async (id) => {
      if (!confirm('ທ່ານຕ້ອງການລຶບແຈ້ງເຕືອນນີ້ຫຼືບໍ່?')) return

      try {
        console.log('🗑️ Deleting notification:', id)
        
        // Convert ID for API call
        let apiId = id
        if (id.startsWith('db_')) {
          apiId = id.replace('db_', '')
        }
        
        const response = await api.delete(`/api/notifications/${apiId}`)
        
        if (response.data.success) {
          console.log('✅ Notification deleted successfully:', id)
          
          // Remove from local array immediately using original ID
          const index = notifications.value.findIndex(n => n.id === id)
          if (index !== -1) {
            notifications.value.splice(index, 1)
            console.log('✅ Removed from local array:', id)
          }
          
          showNotification({
            type: 'success',
            title: 'ສຳເລັດ',
            message: 'ລຶບແຈ້ງເຕືອນສຳເລັດ'
          })
        } else {
          console.error('❌ Delete failed:', response.data)
          showNotification({
            type: 'error',
            title: 'ຂໍ້ຜິດພາດ',
            message: response.data.error || 'ບໍ່ສາມາດລຶບແຈ້ງເຕືອນໄດ້'
          })
        }
      } catch (error) {
        console.error('❌ Error deleting notification:', error)
        
        if (error.response?.status === 404) {
          // Notification not found - remove from local array
          const index = notifications.value.findIndex(n => n.id === id)
          if (index !== -1) {
            notifications.value.splice(index, 1)
          }
          showNotification({
            type: 'warning',
            title: 'ເຕືອນ',
            message: 'ການແຈ້ງເຕືອນບໍ່ພົບ - ລຶບອອກຈາກລາຍການ'
          })
        } else {
          showNotification({
            type: 'error',
            title: 'ຂໍ້ຜິດພາດ',
            message: 'ບໍ່ສາມາດລຶບແຈ້ງເຕືອນໄດ້'
          })
        }
      }
    }

    const dismissAlert = async (alertId) => {
      try {
        // Remove alert from local array (since these are generated from weather data)
        const index = weatherAlerts.value.findIndex(alert => alert.id === alertId)
        if (index !== -1) {
          weatherAlerts.value.splice(index, 1)
          showNotification({
            type: 'success',
            title: 'ສຳເລັດ',
            message: 'ຍົກເລີກແຈ້ງເຕືອນສຳເລັດ'
          })
        }
      } catch (error) {
        console.error('Error dismissing alert:', error)
        showNotification({
          type: 'error',
          title: 'ຂໍ້ຜິດພາດ',
          message: 'ບໍ່ສາມາດຍົກເລີກແຈ້ງເຕືອນໄດ້'
        })
      }
    }

    const loadNotifications = async () => {
      try {
        isLoading.value = true
        console.log('🔄 Loading notifications...');
        const response = await api.get('/api/notifications')
        
        if (response.data.success && isComponentMounted.value) {
          console.log('✅ Notifications loaded:', response.data.data);
          
          // Handle different response formats
          let notificationsList = [];
          if (response.data.data.notifications) {
            notificationsList = response.data.data.notifications;
          } else if (Array.isArray(response.data.data)) {
            notificationsList = response.data.data;
          }
          
          // Convert API response to expected format
          notifications.value = notificationsList.map(notification => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type || 'manual',
            severity: notification.priority === 'Critical' ? 'critical' : 
                     notification.priority === 'High' ? 'high' : 
                     notification.priority === 'Low' ? 'low' : 'medium',
            status: notification.status === 'Unread' ? 'draft' : 'sent',
            created_at: notification.time || notification.created_at,
            recipient_count: Math.floor(Math.random() * 100) + 1 // Mock recipient count
          }));
          
          console.log('✅ Processed notifications:', notifications.value.length);
          
        } else {
          console.error('❌ Invalid response format or component unmounted:', response.data);
          if (isComponentMounted.value) {
            notifications.value = [];
          }
        }
      } catch (error) {
        console.error('❌ Error loading notifications:', error);
        if (isComponentMounted.value) {
          notifications.value = [];
          
          showNotification({
            type: 'error',
            title: 'ຂໍ້ຜິດພາດ',
            message: 'ບໍ່ສາມາດໂຫຼດຂໍ້ມູນການແຈ້ງເຕືອນໄດ້'
          });
        }
      } finally {
        isLoading.value = false
      }
    }

    const loadWeatherAlerts = async () => {
      try {
        // Use the same method as checkWeatherAnomalies
        await checkWeatherAnomalies()
      } catch (error) {
        console.error('Error loading weather alerts:', error)
        weatherAlerts.value = []
      }
    }

    const clearNotificationForm = () => {
      newNotification.title = ''
      newNotification.message = ''
      newNotification.type = 'weather'
      newNotification.severity = 'medium'
      newNotification.recommendations = ''
    }

    const refreshData = async () => {
      await Promise.all([
        loadNotifications(),
        loadWeatherAlerts(),
        updateAlertStats()
      ])
      showNotification({
        type: 'success',
        title: 'ສຳເລັດ',
        message: 'ໂຫຼດຂໍ້ມູນໃໝ່ສຳເລັດ'
      })
    }

    // New methods for filtering and export
    const clearFilters = () => {
      dateFilter.startDate = ''
      dateFilter.endDate = ''
      typeFilter.value = ''
      severityFilter.value = ''
    }

    const applyFilters = () => {
      // The filtering is already reactive through computed property
      showNotification({
        type: 'info',
        title: 'ການກັ່ນຕອງ',
        message: `ພົບ ${filteredNotifications.value.length} ລາຍການ`
      })
    }

    const exportNotifications = () => {
      try {
        const dataToExport = filteredNotifications.value.map(notification => ({
          'ວັນທີ': formatDate(notification.created_at),
          'ຫົວຂໍ້': notification.title,
          'ຂໍ້ຄວາມ': notification.message,
          'ປະເພດ': getTypeLabel(notification.type),
          'ລະດັບ': getSeverityLabel(notification.severity),
          'ສະຖານະ': getStatusLabel(notification.status),
          'ຈໍານວນຜູ້ຮັບ': notification.recipient_count
        }))

        // Convert to CSV
        const headers = Object.keys(dataToExport[0] || {})
        const csvContent = [
          headers.join(','),
          ...dataToExport.map(row => 
            headers.map(header => 
              `"${(row[header] || '').toString().replace(/"/g, '""')}"`
            ).join(',')
          )
        ].join('\n')

        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `notifications_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showNotification({
          type: 'success',
          title: 'ສຳເລັດ',
          message: `Export ຂໍ້ມູນ ${dataToExport.length} ລາຍການສຳເລັດ`
        })
      } catch (error) {
        console.error('Error exporting notifications:', error)
        showNotification({
          type: 'error',
          title: 'ຂໍ້ຜິດພາດ',
          message: 'ບໍ່ສາມາດ Export ຂໍ້ມູນໄດ້'
        })
      }
    }

    const deleteAllNotifications = async () => {
      if (!confirm('ທ່ານຕ້ອງການລຶບການແຈ້ງເຕືອນທັງໝົດຫຼືບໍ່? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້!')) {
        return
      }

      try {
        isLoading.value = true
        
        console.log('🗑️ Starting to delete all notifications...')
        console.log('Current notifications:', notifications.value.length)
        
        // Use bulk delete endpoint first
        try {
          const bulkResponse = await api.delete('/api/notifications/clear-all')
          if (bulkResponse.data.success) {
            console.log('✅ Bulk delete successful')
            notifications.value = []
            
            showNotification({
              type: 'success',
              title: 'ສຳເລັດ',
              message: 'ລຶບການແຈ້ງເຕືອນທັງໝົດສຳເລັດ'
            })
            return
          }
        } catch (bulkError) {
          console.log('⚠️ Bulk delete failed, trying individual delete...')
        }
        
        // If bulk delete fails, delete individually
        if (notifications.value.length > 0) {
          let deletedCount = 0
          let errorCount = 0
          
          const notificationsToDelete = [...notifications.value] // Copy array
          
          for (const notification of notificationsToDelete) {
            try {
              // Convert ID for API call
              let apiId = notification.id
              if (notification.id.startsWith('db_')) {
                apiId = notification.id.replace('db_', '')
              }
              
              const response = await api.delete(`/api/notifications/${apiId}`)
              if (response.data.success) {
                deletedCount++
                console.log(`✅ Deleted notification ${notification.id}`)
                
                // Remove from local array
                const index = notifications.value.findIndex(n => n.id === notification.id)
                if (index !== -1) {
                  notifications.value.splice(index, 1)
                }
              } else {
                errorCount++
                console.log(`❌ Failed to delete notification ${notification.id}`)
              }
            } catch (error) {
              errorCount++
              console.log(`❌ Error deleting notification ${notification.id}:`, error)
            }
          }
          
          if (deletedCount > 0) {
            showNotification({
              type: 'success',
              title: 'ສຳເລັດ',
              message: `ລຶບການແຈ້ງເຕືອນສຳເລັດ ${deletedCount} ລາຍການ` + 
                      (errorCount > 0 ? ` (ລົ້ມເຫຼວ ${errorCount} ລາຍການ)` : '')
            })
          } else {
            showNotification({
              type: 'warning',
              title: 'ເຕືອນ',
              message: 'ບໍ່ສາມາດລຶບການແຈ້ງເຕືອນໃດໆ ໄດ້'
            })
          }
        } else {
          showNotification({
            type: 'info',
            title: 'ຂໍ້ມູນ',
            message: 'ບໍ່ມີການແຈ້ງເຕືອນໃຫ້ລຶບ'
          })
        }
        
      } catch (error) {
        console.error('❌ Error in deleteAllNotifications:', error)
        showNotification({
          type: 'error',
          title: 'ຂໍ້ຜິດພາດ',
          message: 'ເກີດຂໍ້ຜິດພາດໃນການລຶບການແຈ້ງເຕືອນ'
        })
      } finally {
        isLoading.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      refreshData()
    })
    
    onUnmounted(() => {
      isComponentMounted.value = false
    })

    return {
      notifications,
      filteredNotifications,
      weatherAlerts,
      alertStats,
      isLoading,
      newNotification,
      dateFilter,
      typeFilter,
      severityFilter,
      notificationTypes,
      severityLevels,
      filterTypes,
      filterSeverities,
      notificationHeaders,
      isValidNotification,
      formatTime,
      formatDate,
      getTypeLabel,
      getSeverityLabel,
      getStatusLabel,
      getAlertBorderClass,
      getSeverityColor,
      getTypeColor,
      getStatusColor,
      checkWeatherAnomalies,
      createWeatherNotification,
      createManualNotification,
      broadcastNotification,
      deleteNotification,
      dismissAlert,
      clearNotificationForm,
      refreshData,
      clearFilters,
      applyFilters,
      exportNotifications,
      deleteAllNotifications
    }
  }
}
</script>

<style scoped>
/* Additional custom styles for enhanced UI */
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.border-l-green-500 {
  border-left: 4px solid #10b981;
}

.border-l-yellow-500 {
  border-left: 4px solid #f59e0b;
}

.border-l-orange-500 {
  border-left: 4px solid #f97316;
}

.border-l-red-500 {
  border-left: 4px solid #ef4444;
}

.border-l-blue-500 {
  border-left: 4px solid #3b82f6;
}

.v-data-table {
  background: transparent;
}

.v-data-table__wrapper {
  border-radius: 8px;
  overflow: hidden;
}

.v-btn:disabled {
  opacity: 0.6;
}

.text-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>