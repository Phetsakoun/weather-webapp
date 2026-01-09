// src/services/notificationService.js
import { ref } from 'vue'

// Global notification state
const notification = ref({
  show: false,
  type: 'info', // 'success', 'warning', 'error', 'info'
  title: '',
  message: '',
  timeout: 5000
})

let timeoutId = null

export const showNotification = (options) => {
  // Clear existing timeout
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  // Set notification
  notification.value = {
    show: true,
    type: options.type || 'info',
    title: options.title || '',
    message: options.message || '',
    timeout: options.timeout || 5000
  }

  // Auto hide after timeout
  if (notification.value.timeout > 0) {
    timeoutId = setTimeout(() => {
      hideNotification()
    }, notification.value.timeout)
  }
}

export const hideNotification = () => {
  notification.value.show = false
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

export const showError = (message, title = 'Error') => {
  showNotification({
    type: 'error',
    title,
    message,
    timeout: 7000
  })
}

export const showSuccess = (message, title = 'Success') => {
  showNotification({
    type: 'success',
    title,
    message,
    timeout: 5000
  })
}

export const showWarning = (message, title = 'Warning') => {
  showNotification({
    type: 'warning',
    title,
    message,
    timeout: 6000
  })
}

export const showInfo = (message, title = 'Info') => {
  showNotification({
    type: 'info',
    title,
    message,
    timeout: 4000
  })
}

export { notification }
