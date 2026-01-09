import { ref } from 'vue'

const API_BASE_URL = 'http://localhost:5000/api'

export function useNotifications() {
  const loading = ref(false)
  const error = ref(null)

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      console.error('API call failed:', err)
      throw err
    }
  }

  // Get all notifications with filtering
  const fetchNotifications = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value)
        }
      })
      
      const endpoint = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await apiCall(endpoint)
      
      return response.data
    } catch (err) {
      console.log('Notifications API not available, using mock data')
      error.value = null // Clear error for demo
      
      // Return mock notifications for demonstration
      const mockNotifications = [
        {
          id: 1,
          type: 'Weather',
          title: 'ການແຈ້ງເຕືອນສະພາບອາກາດ',
          message: 'ອຸນຫະພູມມື້ນີ້ອາດຈະສູງເຖິງ 35°C',
          priority: 'Warning',
          status: 'Unread',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          type: 'System',
          title: 'ການອັບເດດລະບົບ',
          message: 'ລະບົບໄດ້ຮັບການອັບເດດສຳເລັດແລ້ວ',
          priority: 'Info',
          status: 'Read',
          time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          type: 'User',
          title: 'ຜູ້ໃຊ້ໃໝ່ລົງທະບຽນ',
          message: 'ມີຜູ້ໃຊ້ໃໝ່ລົງທະບຽນເຂົ້າລະບົບ',
          priority: 'Low',
          status: 'Unread',
          time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ]
      
      const mockStats = {
        critical: 0,
        warning: 1,
        info: 1,
        unread: 2
      }
      
      return {
        notifications: mockNotifications,
        alertStats: mockStats,
        total: mockNotifications.length
      }
    } finally {
      loading.value = false
    }
  }

  // Get notification count
  const fetchNotificationCount = async () => {
    try {
      const response = await apiCall('/notifications/count')
      return response.count
    } catch (err) {
      console.log('Notification count API not available, using mock data')
      return 3 // Mock count
    }
  }

  // Create new notification
  const createNotification = async (notificationData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiCall('/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData)
      })
      
      return response.data
    } catch (err) {
      console.log('Create notification API not available, simulating success')
      error.value = null
      
      // Return mock success response
      return {
        success: true,
        id: Date.now(),
        ...notificationData,
        time: new Date().toISOString(),
        status: 'Unread'
      }
    } finally {
      loading.value = false
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiCall(`/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
    } catch (err) {
      console.log('Mark as read API not available, simulating success')
      // Simulate success for demo
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiCall('/notifications/read-all', {
        method: 'PUT'
      })
    } catch (err) {
      console.log('Mark all as read API not available, simulating success')
      // Simulate success for demo
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await apiCall(`/notifications/${notificationId}`, {
        method: 'DELETE'
      })
    } catch (err) {
      console.log('Delete notification API not available, simulating success')
      // Simulate success for demo
    }
  }

  // Get notification settings
  const fetchSettings = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiCall('/notifications/settings')
      return response.data
    } catch (err) {
      console.log('Settings API not available, using mock data')
      error.value = null
      
      // Return mock settings
      return {
        pushNotifications: true,
        systemAlerts: true,
        newsAlerts: true,
        userAlerts: false,
        emailNotifications: false,
        smsNotifications: false
      }
    } finally {
      loading.value = false
    }
  }

  // Update notification settings
  const updateSettings = async (settings) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiCall('/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      })
      
      return response.data
    } catch (err) {
      console.log('Update settings API not available, simulating success')
      error.value = null
      
      // Return mock success
      return {
        success: true,
        settings: settings
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchNotifications,
    fetchNotificationCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchSettings,
    updateSettings
  }
}
