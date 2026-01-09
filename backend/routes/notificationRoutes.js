const express = require('express');

const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET /api/notifications/active - Get active notifications for users (public)
router.get('/active', notificationController.getActiveNotifications);

// GET /api/notifications/weather-alerts - Get weather alerts for user (called when user visits website)
router.get('/weather-alerts', notificationController.getUserWeatherAlerts);

// GET /api/notifications/count - Get notification count only
router.get('/count', notificationController.getNotificationCount);

// GET /api/notifications - Get all notifications with filtering and pagination
router.get('/', notificationController.getNotifications);

// POST /api/notifications - Create a new notification/alert
router.post('/', notificationController.createNotification);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// GET /api/notifications/settings - Get notification settings
router.get('/settings', notificationController.getSettings);

// PUT /api/notifications/settings - Update notification settings
router.put('/settings', notificationController.updateSettings);

// POST /api/notifications/weather-alerts - Create weather alert
router.post('/weather-alerts', notificationController.createWeatherAlert);

// DELETE /api/notifications/weather-alerts/:alertId - Delete weather alert
router.delete('/weather-alerts/:alertId', notificationController.deleteWeatherAlert);

// GET /api/notifications/cities - Get all cities for alert creation
router.get('/cities', notificationController.getCitiesForAlerts);

// DELETE /api/notifications/clear-manual-alerts - Clear all manual alerts (for testing)
router.delete('/clear-manual-alerts', notificationController.clearAllManualAlerts);

// DELETE /api/notifications/clear-old - Clear old notifications from database
router.delete('/clear-old', notificationController.clearOldNotifications);

// DELETE /api/notifications/clear-all - Clear all notifications from database
router.delete('/clear-all', notificationController.clearAllNotifications);

// POST /api/notifications/broadcast - Broadcast notification to all users
router.post('/broadcast', notificationController.broadcastNotification);

// POST /api/notifications/lstm-check - Check weather using LSTM model
router.post('/lstm-check', notificationController.checkLSTM);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
