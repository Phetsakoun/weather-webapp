// src/services/disasterAlertService.js
import api from '@/plugins/axios'

export class DisasterAlertService {
  
  /**
   * Fetch active disaster alerts for users
   * @returns {Promise<Array>} Array of active alerts
   */
  static async fetchActiveAlerts() {
    try {
      const response = await api.get('/api/notifications', {
        params: {
          audience: 'user',
          status: 'active'
        }
      })

      if (response.data.success && response.data.data) {
        const notifications = response.data.data.notifications || []
        
        // Filter active notifications based on time range and relevance
        const now = new Date()
        const activeAlerts = notifications.filter(notification => {
          const startTime = new Date(notification.time || notification.start_time)
          const endTime = notification.end_time ? new Date(notification.end_time) : null
          
          // Check if notification is within time range
          const isInTimeRange = startTime <= now && (!endTime || endTime >= now)
          
          // Check if it's system or admin generated
          const isRelevant = ['System', 'Manual', 'Weather'].includes(notification.type)
          
          // Check priority level (only show high priority alerts in popup)
          const isHighPriority = ['Critical', 'High'].includes(notification.priority)
          
          return isInTimeRange && isRelevant && isHighPriority
        })

        return activeAlerts.map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          severity: this.mapPriorityToSeverity(notification.priority),
          type: notification.type,
          start_time: notification.time || notification.start_time,
          end_time: notification.end_time,
          status: 'active',
          recommendations: notification.recommendations ? 
            notification.recommendations.split('\n').filter(r => r.trim()) : [],
          priority: notification.priority,
          metadata: notification.metadata || {}
        }))
      }

      return []
    } catch (error) {
      console.error('Error fetching active alerts:', error)
      return []
    }
  }

  /**
   * Map priority to severity level
   * @param {string} priority - Priority level from backend
   * @returns {string} Severity level for UI
   */
  static mapPriorityToSeverity(priority) {
    switch (priority) {
      case 'Critical': return 'critical'
      case 'High': return 'high'
      case 'Medium': return 'medium'
      case 'Low': return 'low'
      default: return 'medium'
    }
  }

  /**
   * Acknowledge a notification
   * @param {string} notificationId - The ID of the notification to acknowledge
   * @returns {Promise<boolean>} Success status
   */
  static async acknowledgeNotification(notificationId) {
    try {
      const response = await api.post(`/api/notifications/${notificationId}/acknowledge`)
      return response.data.success
    } catch (error) {
      console.error('Error acknowledging notification:', error)
      return false
    }
  }

  /**
   * Get alert statistics
   * @returns {Promise<Object>} Alert statistics
   */
  static async getAlertStats() {
    try {
      const response = await api.get('/api/notifications/count')
      return {
        total: response.data.count || 0,
        critical: response.data.critical || 0,
        high: response.data.high || 0,
        medium: response.data.medium || 0,
        low: response.data.low || 0
      }
    } catch (error) {
      console.error('Error fetching alert stats:', error)
      return {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    }
  }

  /**
   * Check if alert should be shown based on localStorage
   * @param {string} alertId - The ID of the alert
   * @returns {boolean} Whether to show the alert
   */
  static shouldShowAlert(alertId) {
    try {
      const acknowledgedAlerts = JSON.parse(localStorage.getItem('acknowledgedAlerts') || '[]')
      return !acknowledgedAlerts.includes(alertId)
    } catch (error) {
      console.error('Error checking acknowledged alerts:', error)
      return true
    }
  }

  /**
   * Mark alert as acknowledged in localStorage
   * @param {string} alertId - The ID of the alert
   */
  static markAsAcknowledged(alertId) {
    try {
      const acknowledgedAlerts = JSON.parse(localStorage.getItem('acknowledgedAlerts') || '[]')
      if (!acknowledgedAlerts.includes(alertId)) {
        acknowledgedAlerts.push(alertId)
        localStorage.setItem('acknowledgedAlerts', JSON.stringify(acknowledgedAlerts))
      }
    } catch (error) {
      console.error('Error marking alert as acknowledged:', error)
    }
  }

  /**
   * Clear old acknowledged alerts from localStorage (older than 24 hours)
   */
  static clearOldAcknowledged() {
    try {
      // For now, just clear all acknowledged alerts
      // In a real implementation, you might want to store timestamps
      localStorage.removeItem('acknowledgedAlerts')
    } catch (error) {
      console.error('Error clearing old acknowledged alerts:', error)
    }
  }

  /**
   * Format alert for display
   * @param {Object} alert - Raw alert data
   * @returns {Object} Formatted alert
   */
  static formatAlert(alert) {
    return {
      ...alert,
      displayTime: this.formatDateTime(alert.start_time),
      displayEndTime: alert.end_time ? this.formatDateTime(alert.end_time) : null,
      severityLabel: this.getSeverityLabel(alert.severity),
      severityIcon: this.getSeverityIcon(alert.severity),
      severityColor: this.getSeverityColor(alert.severity)
    }
  }

  /**
   * Format date time for display
   * @param {string} dateTime - ISO date string
   * @returns {string} Formatted date time
   */
  static formatDateTime(dateTime) {
    if (!dateTime) return ''
    const date = new Date(dateTime)
    return date.toLocaleString('lo-LA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get severity label in Lao
   * @param {string} severity - Severity level
   * @returns {string} Lao label
   */
  static getSeverityLabel(severity) {
    switch (severity) {
      case 'critical': return 'ເຫດຮຸນແຮງ'
      case 'high': return 'ສຳຄັນ'
      case 'medium': return 'ປານກາງ'
      case 'low': return 'ທົ່ວໄປ'
      default: return 'ແຈ້ງເຕືອນ'
    }
  }

  /**
   * Get severity icon
   * @param {string} severity - Severity level
   * @returns {string} Emoji icon
   */
  static getSeverityIcon(severity) {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⚡'
      case 'low': return '💡'
      default: return '📢'
    }
  }

  /**
   * Get severity color class
   * @param {string} severity - Severity level
   * @returns {string} CSS color class
   */
  static getSeverityColor(severity) {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-blue-500'
    }
  }
}

export default DisasterAlertService
