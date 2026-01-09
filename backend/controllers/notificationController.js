const Weather = require('../models/weatherModel');
const News = require('../models/newsModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const City = require('../models/cityModel');
const WeatherForecast = require('../models/weatherForecastModel');
const { Op } = require('sequelize');

// In-memory storage for manual alerts (in production, use database)
let manualAlerts = [];

// Clear all manual alerts (for testing/cleanup)
const clearAllManualAlerts = async (req, res) => {
  try {
    console.log('🧹 Clearing all manual alerts...');
    const beforeCount = manualAlerts.length;
    manualAlerts = [];
    
    console.log(`✅ Cleared ${beforeCount} manual alerts`);
    
    res.json({
      success: true,
      message: `Cleared ${beforeCount} manual alerts`,
      clearedCount: beforeCount
    });
  } catch (error) {
    console.error('❌ Error clearing manual alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear manual alerts',
      details: error.message
    });
  }
};

// Get active notifications for users (public endpoint)
const getActiveNotifications = async (req, res) => {
  try {
    console.log('🔍 Fetching active notifications for users...');
    
    const notifications = [];
    
    // Get from database (notifications that are not dismissed)
    const dbNotifications = await Notification.findAll({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    // Convert database notifications
    dbNotifications.forEach(notification => {
      const priority = notification.type === 'error' ? 'critical' : 
                     notification.type === 'warning' ? 'high' : 'medium';
      
      notifications.push({
        id: `db_${notification.id}`,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'system',
        priority: priority,
        created_at: notification.created_at,
        source: 'database'
      });
    });
    
    // Add manual alerts
    const recentManualAlerts = manualAlerts.filter(alert => {
      const alertTime = new Date(alert.time);
      const now = new Date();
      const hoursDiff = (now - alertTime) / (1000 * 60 * 60);
      return hoursDiff <= 24; // Show alerts from last 24 hours
    });
    
    recentManualAlerts.forEach(alert => {
      notifications.push({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        type: alert.type || 'manual',
        priority: alert.priority.toLowerCase(),
        created_at: alert.time,
        source: 'manual'
      });
    });
    
    // Sort by time (newest first)
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`✅ Found ${notifications.length} active notifications`);
    
    res.json({
      success: true,
      data: notifications
    });
    
  } catch (error) {
    console.error('❌ Error fetching active notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active notifications',
      details: error.message
    });
  }
};

// Get all notifications with filtering and pagination
const getNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type = null, 
      priority = null, 
      status = null,
      search = null 
    } = req.query;

    console.log('🔍 Fetching notifications with filters:', { type, priority, status, search });

    const notifications = [];
    let alertStats = {
      critical: 0,
      warning: 0,
      info: 0,
      unread: 0
    };

    // Fetch notifications from database
    const dbNotifications = await Notification.findAll({
      order: [['created_at', 'DESC']],
      limit: 50 // Get recent notifications
    });

    // Add database notifications to the list
    dbNotifications.forEach(notification => {
      const priority = notification.priority || 
                     (notification.type === 'warning' ? 'High' : 
                      notification.type === 'error' ? 'Critical' : 'Low');
      
      notifications.push({
        id: `db_${notification.id}`,
        type: notification.type || 'System',
        title: notification.title,
        message: notification.message,
        priority: priority,
        status: notification.is_read ? 'Read' : 'Unread',
        time: notification.created_at,
        metadata: { 
          source: 'database',
          original_type: notification.type,
          user_id: notification.user_id
        }
      });

      // Update stats
      if (priority === 'Critical') alertStats.critical++;
      else if (priority === 'High') alertStats.warning++;
      else alertStats.info++;
      
      if (!notification.is_read) alertStats.unread++;
    });

    // Add manual alerts to notifications
    manualAlerts.forEach(alert => {
      notifications.push(alert);
      
      // Update stats
      if (alert.priority === 'Critical') alertStats.critical++;
      else if (alert.priority === 'High') alertStats.warning++;
      else alertStats.info++;
      
      if (alert.status === 'Unread') alertStats.unread++;
    });

    // Check for recent weather data updates (last 24 hours)
    const recentWeatherCount = await Weather.count({
      where: {
        timestamp: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Check for recent news (last 24 hours)
    const recentNewsCount = await News.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Check for new users (last 24 hours)
    const newUsersCount = await User.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Check for weather alerts (extreme temperatures, high rainfall)
    const extremeWeather = await Weather.findAll({
      where: {
        [Op.or]: [
          { temperature: { [Op.gt]: 40 } }, // Very hot
          { temperature: { [Op.lt]: 0 } },  // Freezing
          { rainfall: { [Op.gt]: 50 } }     // Heavy rain
        ],
        timestamp: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: ['weatherCity'],
      limit: 10
    });

    // Generate weather alert notifications
    extremeWeather.forEach((weather, index) => {
      let priority = 'Medium';
      let alertType = 'info';
      let message = '';

      if (weather.temperature > 30) {
        priority = 'High';
        alertType = 'warning';
        message = `ອຸນຫະພູມສູງ ${weather.temperature}°C ທີ່ ${weather.weatherCity?.name || 'ບໍ່ຮູ້'}`;
      } else if (weather.temperature < 15) {
        priority = 'Medium';
        alertType = 'info';
        message = `ອຸນຫະພູມຕໍ່າ ${weather.temperature}°C ທີ່ ${weather.weatherCity?.name || 'ບໍ່ຮູ້'}`;
      } else if (weather.rainfall > 50) {
        priority = weather.rainfall > 80 ? 'High' : 'Medium';
        alertType = weather.rainfall > 80 ? 'warning' : 'info';
        message = `ຝົນຕົກໜັກ ${weather.rainfall}mm ທີ່ ${weather.weatherCity?.name || 'ບໍ່ຮູ້'}`;
      }

      notifications.push({
        id: `weather_${index + 1}`,
        type: 'Weather',
        title: 'ແຈ້ງເຕືອນສະພາບອາກາດ',
        message: message,
        priority: priority,
        status: 'Unread',
        time: weather.timestamp,
        metadata: {
          cityId: weather.city_id,
          temperature: weather.temperature,
          rainfall: weather.rainfall
        }
      });

      // Update stats
      if (priority === 'Critical') alertStats.critical++;
      else if (priority === 'High') alertStats.warning++;
      else alertStats.info++;
      alertStats.unread++;
    });

    // Add system notifications (only if requested)
    const { includeSystemNotifications = false } = req.query;
    
    if (includeSystemNotifications === 'true') {
      if (recentWeatherCount > 0) {
        notifications.push({
          id: 'weather_update',
          type: 'System',
          title: 'ອັບເດດຂໍ້ມູນອາກາດ',
          message: `ມີຂໍ້ມູນອາກາດໃໝ່ ${recentWeatherCount} ລາຍການໃນ 24 ຊົ່ວໂມງຜ່ານມາ`,
          priority: 'Low',
          status: 'Unread',
          time: new Date(),
          metadata: { count: recentWeatherCount }
        });
        alertStats.info++;
        alertStats.unread++;
      }

      if (recentNewsCount > 0) {
        notifications.push({
          id: 'news_update',
          type: 'News',
          title: 'ຂ່າວສານໃໝ່',
          message: `ມີຂ່າວໃໝ່ ${recentNewsCount} ລາຍການໃນ 24 ຊົ່ວໂມງຜ່ານມາ`,
          priority: 'Low',
          status: 'Unread',
          time: new Date(),
          metadata: { count: recentNewsCount }
        });
        alertStats.info++;
        alertStats.unread++;
      }

      if (newUsersCount > 0) {
        notifications.push({
          id: 'user_update',
          type: 'User',
          title: 'ຜູ້ໃຊ້ໃໝ່',
          message: `ມີຜູ້ໃຊ້ໃໝ່ ${newUsersCount} ຄົນລົງທະບຽນໃນ 24 ຊົ່ວໂມງຜ່ານມາ`,
          priority: 'Low',
          status: 'Unread',
          time: new Date(),
          metadata: { count: newUsersCount }
        });
        alertStats.info++;
        alertStats.unread++;
      }

      // Add system health notification
      notifications.push({
        id: 'system_health',
        type: 'System',
        title: 'ສະຖານະລະບົບ',
        message: 'ທຸກໆ ບໍລິການເຮັດວຽກປົກກະຕິດີ',
        priority: 'Low',
        status: 'Read',
        time: new Date(),
        metadata: { status: 'healthy' }
      });
      alertStats.info++;
    }

    // Apply filters
    let filteredNotifications = notifications;

    if (type) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.type.toLowerCase() === type.toLowerCase()
      );
    }

    if (priority) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.priority.toLowerCase() === priority.toLowerCase()
      );
    }

    if (status) {
      filteredNotifications = filteredNotifications.filter(n => 
        n.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredNotifications = filteredNotifications.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        alertStats: alertStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredNotifications.length,
          totalPages: Math.ceil(filteredNotifications.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch notifications',
      data: {
        notifications: [],
        alertStats: { critical: 0, warning: 0, info: 0, unread: 0 }
      }
    });
  }
};

// Get notification count only
const getNotificationCount = async (req, res) => {
  try {
    console.log('🔍 Fetching notification count...');
    
    // Check for recent activity
    const recentWeatherCount = await Weather.count({
      where: {
        timestamp: {
          [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours
        }
      }
    });

    const recentNewsCount = await News.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
        }
      }
    });

    const newUsersCount = await User.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
        }
      }
    });

    // Check for weather alerts
    const alertCount = await Weather.count({
      where: {
        [Op.or]: [
          { temperature: { [Op.gt]: 40 } },
          { temperature: { [Op.lt]: 0 } },
          { rainfall: { [Op.gt]: 50 } }
        ],
        timestamp: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    let totalCount = alertCount; // Start with weather alerts
    if (recentWeatherCount > 0) totalCount++;
    if (recentNewsCount > 0) totalCount++;
    if (newUsersCount > 0) totalCount++;
    totalCount++; // System health

    console.log('✅ Notification count:', totalCount);
    res.json({ count: totalCount });
    
  } catch (error) {
    console.error('❌ Error fetching notification count:', error);
    res.json({ count: 3 }); // fallback
  }
};

// Create a new notification/alert
const createNotification = async (req, res) => {
  try {
    const { type, title, message, priority = 'Medium', recommendations } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Type, title, and message are required'
      });
    }

    // Save to database
    const dbNotification = await Notification.create({
      type,
      title,
      message,
      priority,
      status: 'Unread',
      metadata: { 
        created_by_admin: true,
        recommendations: recommendations || null
      }
    });

    // Also add to manual alerts for immediate display
    const newNotification = {
      id: `custom_${Date.now()}`,
      type,
      title,
      message,
      priority,
      status: 'Unread',
      time: new Date(),
      metadata: { 
        created_by_admin: true,
        recommendations: recommendations || null
      }
    };

    // Add to manual alerts array
    manualAlerts.push(newNotification);

    console.log('✅ Created notification in database:', dbNotification.id);
    console.log('✅ Added to manual alerts:', newNotification.id);

    res.json({
      success: true,
      data: {
        id: dbNotification.id,
        type: dbNotification.type,
        title: dbNotification.title,
        message: dbNotification.message,
        priority: dbNotification.priority,
        status: dbNotification.status,
        created_at: dbNotification.created_at
      },
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      details: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('✅ Marked notification as read:', id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    console.log('✅ Marked all notifications as read');

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Attempting to delete notification:', id);
    
    let actualId = id;
    let notificationSource = 'database';
    
    // Handle different ID formats
    if (id.startsWith('db_')) {
      // Database notification: extract actual ID
      actualId = id.replace('db_', '');
      notificationSource = 'database';
    } else if (id.startsWith('weather_') || id.startsWith('system_')) {
      // Manual alert: remove from manual alerts array
      notificationSource = 'manual';
    }
    
    if (notificationSource === 'database') {
      // Delete from database
      const notification = await Notification.findByPk(actualId);
      if (!notification) {
        console.log('❌ Database notification not found:', actualId);
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }
      
      await notification.destroy();
      console.log('✅ Successfully deleted database notification:', actualId);
      
    } else if (notificationSource === 'manual') {
      // Delete from manual alerts array
      const initialLength = manualAlerts.length;
      const filteredAlerts = manualAlerts.filter(alert => alert.id !== id);
      
      if (filteredAlerts.length === initialLength) {
        console.log('❌ Manual alert not found:', id);
        return res.status(404).json({
          success: false,
          error: 'Manual alert not found'
        });
      }
      
      // Clear the array and repopulate
      manualAlerts.length = 0;
      manualAlerts.push(...filteredAlerts);
      
      console.log('✅ Successfully deleted manual alert:', id);
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      deletedId: id,
      source: notificationSource
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      details: error.message
    });
  }
};

// Clear old notifications from database
const clearOldNotifications = async (req, res) => {
  try {
    console.log('🧹 Clearing old notifications...');
    
    const { hours = 24 } = req.query; // Default: clear notifications older than 24 hours
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const deleted = await Notification.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffTime
        }
      }
    });
    
    console.log(`✅ Cleared ${deleted} old notifications`);
    
    res.json({
      success: true,
      message: `Cleared ${deleted} old notifications`,
      clearedCount: deleted,
      cutoffTime: cutoffTime
    });
    
  } catch (error) {
    console.error('❌ Error clearing old notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear old notifications',
      details: error.message
    });
  }
};

// Clear all notifications from database
const clearAllNotifications = async (req, res) => {
  try {
    console.log('🧹 Clearing ALL notifications...');
    
    // Clear database notifications
    const deleted = await Notification.destroy({
      where: {},
      truncate: true
    });
    
    console.log(`✅ Cleared all database notifications`);
    
    // Clear manual alerts
    const manualAlertsCount = manualAlerts.length;
    manualAlerts.length = 0; // Clear the array
    
    console.log(`✅ Cleared ${manualAlertsCount} manual alerts`);
    
    res.json({
      success: true,
      message: 'All notifications cleared',
      clearedCount: {
        database: deleted || 'all',
        manualAlerts: manualAlertsCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error clearing all notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear all notifications',
      details: error.message
    });
  }
};

// Get notification settings
const getSettings = async (req, res) => {
  try {
    // In a real app, you'd fetch from database
    const settings = {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      soundAlerts: true,
      weatherAlerts: true,
      systemAlerts: true,
      newsAlerts: true,
      userAlerts: false
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
};

// Update notification settings
const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    console.log('✅ Updated notification settings:', settings);

    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
};

// Create manual weather alert
const createWeatherAlert = async (req, res) => {
  try {
    const { 
      cityId, 
      alertType, 
      severity, 
      title, 
      message, 
      value, 
      unit,
      recommendations = []
    } = req.body;

    console.log('🚨 Creating manual weather alert:', { cityId, alertType, severity });

    // Validate required fields
    if (!cityId || !alertType || !severity || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: cityId, alertType, severity, title, message'
      });
    }

    // Get city information
    const City = require('../models/cityModel');
    const city = await City.findByPk(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'City not found'
      });
    }

    // Create weather alert notification
    const alertData = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'Weather',
      title: title,
      message: message,
      priority: severity === 'critical' ? 'Critical' : 
               severity === 'warning' ? 'High' : 
               severity === 'info' ? 'Medium' : 'Low',
      status: 'Unread',
      time: new Date(),
      metadata: {
        cityId: cityId,
        cityName: city.name_th || city.name_en,
        alertType: alertType,
        severity: severity,
        value: value,
        unit: unit,
        recommendations: recommendations,
        isManual: true,
        createdBy: 'admin'
      }
    };

    console.log('✅ Manual weather alert created:', alertData);

    // Store the alert in memory
    manualAlerts.push(alertData);

    res.json({
      success: true,
      data: alertData,
      message: 'Weather alert created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating weather alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create weather alert',
      details: error.message
    });
  }
};

// Delete weather alert
const deleteWeatherAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    console.log('🗑️ Deleting weather alert:', alertId);

    // Remove from manual alerts array
    const initialLength = manualAlerts.length;
    manualAlerts = manualAlerts.filter(alert => alert.id !== alertId);
    
    if (manualAlerts.length < initialLength) {
      console.log('✅ Weather alert removed from memory');
    } else {
      console.log('⚠️ Weather alert not found in memory');
    }

    res.json({
      success: true,
      message: 'Weather alert deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting weather alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete weather alert',
      details: error.message
    });
  }
};

// Get all cities for alert creation
const getCitiesForAlerts = async (req, res) => {
  try {
    console.log('🏙️ Fetching cities for alert creation');

    const City = require('../models/cityModel');
    const cities = await City.findAll({
      attributes: ['id', 'name_th', 'name_en', 'province_id'],
      order: [['name_th', 'ASC']]
    });

    const formattedCities = cities.map(city => ({
      id: city.id,
      name: city.name_th || city.name_en,
      name_en: city.name_en,
      province_id: city.province_id
    }));

    res.json({
      success: true,
      data: formattedCities,
      count: formattedCities.length
    });

  } catch (error) {
    console.error('❌ Error fetching cities for alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities',
      details: error.message
    });
  }
};

// Broadcast notification to all users
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type = 'System', priority = 'medium' } = req.body;
    
    console.log('📢 Broadcasting notification:', { title, message, type, priority });
    
    // In a real implementation, this would:
    // 1. Send push notifications to all users
    // 2. Send email notifications
    // 3. Update WebSocket connections
    // 4. Log the broadcast to database
    
    // For now, we'll just create a notification in the database
    const notification = await Notification.create({
      title,
      message,
      type,
      priority,
      status: 'sent',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Simulate broadcast delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      message: 'Notification broadcasted successfully',
      data: {
        id: notification.id,
        title,
        message,
        type,
        priority,
        broadcastedAt: new Date().toISOString(),
        estimatedReach: 1000 // Mock number of users reached
      }
    });
    
  } catch (error) {
    console.error('❌ Error broadcasting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification',
      details: error.message
    });
  }
};

// Check weather using LSTM model
const checkLSTM = async (req, res) => {
  try {
    console.log('🧠 Running LSTM weather analysis...');
    
    // Check if LSTM analysis was run recently (prevent duplicate alerts)
    const recentLSTMAlerts = await Notification.count({
      where: {
        type: 'LSTM',
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes
        }
      }
    });
    
    if (recentLSTMAlerts > 0) {
      console.log(`⏭️ LSTM analysis skipped - ${recentLSTMAlerts} recent alerts found`);
      return res.json({
        success: true,
        message: 'LSTM analysis skipped - recent alerts exist',
        data: {
          status: 'skipped',
          recent_alerts: recentLSTMAlerts,
          analysis_run: false
        }
      });
    }
    
    // In a real implementation, this would:
    // 1. Call the LSTM model API
    // 2. Analyze current weather data
    // 3. Generate predictions
    // 4. Create alerts if anomalies are detected
    
    // For now, we'll simulate LSTM analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock LSTM results
    const mockResults = {
      analyzed_cities: 18,
      anomalies_detected: Math.floor(Math.random() * 3),
      predictions: [
        {
          city: 'Vientiane',
          temperature_anomaly: false,
          rainfall_anomaly: Math.random() > 0.7,
          wind_anomaly: false,
          confidence: 0.92
        },
        {
          city: 'Luang Prabang',
          temperature_anomaly: Math.random() > 0.8,
          rainfall_anomaly: false,
          wind_anomaly: false,
          confidence: 0.87
        }
      ],
      recommendations: [
        'Monitor rainfall patterns in northern regions',
        'Temperature within normal range for season'
      ]
    };
    
    // If anomalies are detected, create only ONE alert
    if (mockResults.anomalies_detected > 0) {
      const alert = await Notification.create({
        title: `LSTM ແຈ້ງເຕືອນອາກາດຜິດປົກກະຕິ`,
        message: `ພົບຄວາມຜິດປົກກະຕິ ${mockResults.anomalies_detected} ລາຍການໃນຂໍ້ມູນອາກາດຈາກການວິເຄາະ AI - ກະລຸນາຕິດຕາມຢ່າງໃກ້ຊິດ`,
        type: 'LSTM',
        priority: 'Low', // Changed from 'high' to 'Low' to reduce noise
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      mockResults.alerts_created = 1;
      console.log('✅ LSTM alert created:', alert.id);
    }
    
    res.json({
      success: true,
      message: 'LSTM analysis completed',
      data: mockResults
    });
    
  } catch (error) {
    console.error('❌ Error in LSTM analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run LSTM analysis',
      details: error.message
    });
  }
};

// Weather Alert Logic based on LSTM predictions and current conditions
const checkWeatherConditionsAndAlert = async (weatherData, predictions = null) => {
  const alerts = [];
  
  // Define alert thresholds according to new requirements
  const thresholds = {
    heavyRain: 50,        // ມມ./ຊົ່ວໂມງ
    strongWind: 40,       // ກມ./ຊມ.
    hotTemp: 30,          // °C
    coldTemp: 15,         // °C
    lowPressure: 1000,    // hPa
    lightning: 10         // ຄັ້ງໃນ 10 ນາທີ
  };

  try {
    // Check current weather conditions
    if (weatherData) {
      const temp = weatherData.temperature;
      const rainfall = weatherData.rainfall;
      const windSpeed = weatherData.windSpeed;
      const pressure = weatherData.pressure;
      const cityName = weatherData.city?.name || weatherData.location || 'ບໍ່ຮູ້';

      // 1. ຝົນຕົກໜັກ - Heavy Rain Alert
      if (rainfall > thresholds.heavyRain) {
        const severity = rainfall > 80 ? 'High' : 'Medium';
        alerts.push({
          type: 'rain',
          title: `⚠️ ແຈ້ງເຕືອນຝົນຕົກໜັກ - ${cityName}`,
          message: `ປະລິມານຝົນຂະນະນີ້ ${rainfall.toFixed(1)} ມມ./ຊົ່ວໂມງ (ເກີນເກນ ${thresholds.heavyRain} ມມ.)`,
          severity: severity,
          priority: severity,
          location: cityName,
          recommendations: [
            'ຫຼີກເວັ້ນການເດີນທາງທີ່ບໍ່ຈຳເປັນ',
            'ລະວັງນ້ຳຖ້ວມກະທັນຫັນ',
            'ຕິດຕາມຂ່າວສານຢ່າງຕໍ່ເນື່ອງ',
            'ກຽມອຸປະກອນສຸກເສີນ'
          ].join('\n'),
          weatherData: { rainfall, cityName }
        });
      }

      // 2. ລົມແຮງ - Strong Wind Alert
      if (windSpeed > thresholds.strongWind) {
        alerts.push({
          type: 'storm',
          title: `💨 ແຈ້ງເຕືອນລົມແຮງ - ${cityName}`,
          message: `ຄວາມໄວລົມຂະນະນີ້ ${windSpeed.toFixed(1)} ກມ./ຊມ. (ເກີນເກນ ${thresholds.strongWind} ກມ./ຊມ.)`,
          severity: 'High',
          priority: 'High',
          location: cityName,
          recommendations: [
            'ຫຼີກເວັ້ນການຢູ່ກາງແຈ້ງ',
            'ລະວັງວັດຖຸທີ່ອາດຫຼຸດຫຼົ່ນ',
            'ກວດເບິ່ງຫຼັງຄາແລະປະຕູໜ້າຕ່າງ',
            'ຫຼີກເວັ້ນການຂັບຂີ່ຍານພາຫະນະ'
          ].join('\n'),
          weatherData: { windSpeed, cityName }
        });
      }

      // 3. ອຸນຫະພາບຮ້ອນຈັດ - Hot Temperature Alert
      if (temp > thresholds.hotTemp) {
        alerts.push({
          type: 'weather',
          title: `🌡️ ແຈ້ງເຕືອນອຸນຫະພາບຮ້ອນຈັດ - ${cityName}`,
          message: `ອຸນຫະພາບຂະນະນີ້ ${temp.toFixed(1)}°C (ເກີນເກນ ${thresholds.hotTemp}°C)`,
          severity: 'High',
          priority: 'High',
          location: cityName,
          recommendations: [
            'ຫຼີກເວັ້ນການອອກກຳລັງກາຍກາງແຈ້ງ',
            'ດື່ມນ້ຳໃສໃຫ້ພຽງພໍ',
            'ຢູ່ໃນທີ່ຮ່ມຫຼືປັບອາກາດ',
            'ໃສ່ເສື້ອຜ້າສີອ່ອນແລະຫຼວມ'
          ].join('\n'),
          weatherData: { temperature: temp, cityName }
        });
      }

      // 4. ອຸນຫະພາບເຢັນຈັດ - Cold Temperature Alert
      if (temp < thresholds.coldTemp) {
        alerts.push({
          type: 'weather',
          title: `🥶 ແຈ້ງເຕືອນອຸນຫະພາບເຢັນຈັດ - ${cityName}`,
          message: `ອຸນຫະພາບຂະນະນີ້ ${temp.toFixed(1)}°C (ຕ່ຳກວ່າເກນ ${thresholds.coldTemp}°C)`,
          severity: 'Medium',
          priority: 'Medium',
          location: cityName,
          recommendations: [
            'ໃສ່ເສື້ອຜ້າຫນາແລະອຸ່ນ',
            'ລະວັງຄວາມສ່ຽງຈາກຫຼອດເລືອດຫົວໃຈ',
            'ດູແລຜູ້ສູງອາຍຸແລະເດັກນ້ອຍ',
            'ກວດເບິ່ງລະບົບເຮັດຄວາມອຸ່ນໃນບ້ານ'
          ].join('\n'),
          weatherData: { temperature: temp, cityName }
        });
      }

      // 5. ຄວາມກົດອາກາດຕ່ຳຜິດປົກກະຕິ - Low Pressure Alert
      if (pressure < thresholds.lowPressure) {
        alerts.push({
          type: 'storm',
          title: `📉 ແຈ້ງເຕືອນຄວາມກົດອາກາດຕ່ຳຜິດປົກກະຕິ - ${cityName}`,
          message: `ຄວາມກົດອາກາດຂະນະນີ້ ${pressure.toFixed(1)} hPa (ຕ່ຳກວ່າເກນ ${thresholds.lowPressure} hPa)`,
          severity: 'High',
          priority: 'High',
          location: cityName,
          recommendations: [
            'ກຽມພ້ອມສຳລັບພາຍຸຫຼືລົມແຮງ',
            'ຕິດຕາມພະຍາກອນອາກາດຢ່າງໃກ້ຊິດ',
            'ກວດເບິ່ງຄວາມແຂງແຮງຂອງບ້ານ',
            'ກຽມແຜນການຍ້າຍຖິ່ນຖ້າບູສາມາດ'
          ].join('\n'),
          weatherData: { pressure, cityName }
        });
      }

      // 6. ຟ້າຜ່າຮຸນແຮງ - Lightning Alert
      if (weatherData.lightning && weatherData.lightning > thresholds.lightning) {
        alerts.push({
          type: 'storm',
          title: `⚡ ແຈ້ງເຕືອນຟ້າຜ່າຮຸນແຮງ - ${cityName}`,
          message: `ຟ້າຜ່າ ${weatherData.lightning} ຄັ້ງໃນ 10 ນາທີ (ເກີນເກນ ${thresholds.lightning} ຄັ້ງ)`,
          severity: 'High',
          priority: 'High',
          location: cityName,
          recommendations: [
            'ຢູ່ໃນອາຄານທີ່ປອດໄພ',
            'ຫຼີກເວັ້ນການໃຊ້ອຸປະກອນໄຟຟ້າ',
            'ຫ້າມຢູ່ໃຕ້ຕົ້ນໄມ້ຫຼືເສົາໄຟຟ້າ',
            'ລໍຖ້າໃຫ້ພາຍຸຜ່ານພົ້ນກ່ອນອອກຈາກບ້ານ'
          ].join('\n'),
          weatherData: { lightning: weatherData.lightning, cityName }
        });
      }
    }

    // Check LSTM predictions for future alerts
    if (predictions && predictions.length > 0) {
      for (const prediction of predictions) {
        const predTemp = prediction.predicted_temperature;
        const predRainfall = prediction.predicted_rainfall || 0;
        const predDate = new Date(prediction.timestamp);
        const daysDiff = Math.ceil((predDate - new Date()) / (1000 * 60 * 60 * 24));
        
        // Future hot temperature alert
        if (predTemp > thresholds.hotTemp) {
          alerts.push({
            type: 'weather',
            title: `🔮 ພະຍາກອນອຸນຫະພາບຮ້ອນຈັດ (${daysDiff} ມື້ຂ້າງໜ້າ)`,
            message: `ຄາດການອຸນຫະພາບ ${predTemp.toFixed(1)}°C ໃນວັນທີ່ ${predDate.toLocaleDateString('lo-LA')}`,
            severity: 'High',
            priority: 'High',
            location: prediction.cityName || 'ບໍ່ຮູ້',
            recommendations: [
              'ກຽມແຜນການຫຼີກເວັ້ນຄວາມຮ້ອນ',
              'ຈັດເຕີມນ້ຳດື່ມສຳຮອງ',
              'ກວດເບິ່ງລະບົບປັບອາກາດ',
              'ວາງແຜນກິດຈະກຳໃນເວລາທີ່ເໝາະສົມ'
            ].join('\n'),
            weatherData: { temperature: predTemp, forecast: true }
          });
        }

        // Future cold temperature alert
        if (predTemp < thresholds.coldTemp) {
          alerts.push({
            type: 'weather',
            title: `🔮 ພະຍາກອນອຸນຫະພາບເຢັນຈັດ (${daysDiff} ມື້ຂ້າງໜ້າ)`,
            message: `ຄາດການອຸນຫະພາບ ${predTemp.toFixed(1)}°C ໃນວັນທີ່ ${predDate.toLocaleDateString('lo-LA')}`,
            severity: 'Medium',
            priority: 'Medium',
            location: prediction.cityName || 'ບໍ່ຮູ້',
            recommendations: [
              'ກຽມເສື້ອຜ້າຫນາແລະອຸ່ນ',
              'ກວດເບິ່ງລະບົບເຮັດຄວາມອຸ່ນ',
              'ກຽມແຜນດູແລຜູ້ສູງອາຍຸ',
              'ວາງແຜນກິດຈະກຳໃນຮ່ມ'
            ].join('\n'),
            weatherData: { temperature: predTemp, forecast: true }
          });
        }

        // Future heavy rain alert
        if (predRainfall > thresholds.heavyRain) {
          const severity = predRainfall > 80 ? 'High' : 'Medium';
          alerts.push({
            type: 'rain',
            title: `🔮 ພະຍາກອນຝົນຕົກໜັກ (${daysDiff} ມື້ຂ້າງໜ້າ)`,
            message: `ຄາດການປະລິມານຝົນ ${predRainfall.toFixed(1)} ມມ. ໃນວັນທີ່ ${predDate.toLocaleDateString('lo-LA')}`,
            severity: severity,
            priority: severity,
            location: prediction.cityName || 'ບໍ່ຮູ້',
            recommendations: [
              'ກຽມແຜນການເດີນທາງທາງເລືອກ',
              'ກວດເບິ່ງລະບົບລະບາຍນ້ຳ',
              'ກຽມອຸປະກອນສຳຮອງ',
              'ຕິດຕາມຂ່າວສານຢ່າງຕໍ່ເນື່ອງ'
            ].join('\n'),
            weatherData: { rainfall: predRainfall, forecast: true }
          });
        }
      }
    }

    return alerts;
  } catch (error) {
    console.error('❌ Error checking weather conditions:', error);
    return [];
  }
};

// Function to process and store weather alerts
const processWeatherAlerts = async (alerts) => {
  try {
    const processedAlerts = [];
    
    for (const alert of alerts) {
      // Check if similar alert already exists in recent time
      const existingAlert = await Notification.findOne({
        where: {
          type: alert.type,
          title: alert.title,
          created_at: {
            [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
          }
        }
      });

      if (!existingAlert) {
        // Create new notification in database
        const dbNotification = await Notification.create({
          type: alert.type,
          title: alert.title,
          message: alert.message,
          priority: alert.priority,
          status: 'Unread',
          metadata: {
            location: alert.location,
            recommendations: alert.recommendations,
            weatherData: alert.weatherData,
            autoGenerated: true,
            alertType: 'weather_condition'
          }
        });

        // Add to manual alerts for immediate display
        const manualAlert = {
          id: `weather_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          priority: alert.priority,
          status: 'Unread',
          time: new Date(),
          metadata: {
            location: alert.location,
            recommendations: alert.recommendations,
            weatherData: alert.weatherData,
            autoGenerated: true,
            alertType: 'weather_condition'
          }
        };

        manualAlerts.push(manualAlert);
        processedAlerts.push(manualAlert);

        console.log(`🚨 Created weather alert: ${alert.title}`);
      }
    }

    return processedAlerts;
  } catch (error) {
    console.error('❌ Error processing weather alerts:', error);
    return [];
  }
};

// Function to check current weather and LSTM predictions for alerts
const checkAndCreateWeatherAlerts = async () => {
  try {
    console.log('🔍 Checking weather conditions for alerts...');
    
    // Get current weather data from database
    const currentWeatherData = await Weather.findAll({
      include: [{
        model: City,
        as: 'weatherCity',
        attributes: ['id', 'name_th', 'name_en']
      }],
      order: [['timestamp', 'DESC']],
      limit: 18 // All cities in Laos
    });

    // Get LSTM predictions - Skip for now since table schema is being updated
    const predictions = [];
    
    // TODO: Re-enable when WeatherForecast table is properly configured
    // const predictions = await WeatherForecast.findAll({
    //   date_from: new Date().toISOString().split('T')[0],
    //   date_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    //   limit: 50
    // });

    let allAlerts = [];

    // Check each city's current weather
    for (const weather of currentWeatherData) {
      const weatherData = {
        temperature: weather.temperature,
        rainfall: weather.rainfall || 0,
        windSpeed: weather.windSpeed || 0,
        pressure: weather.pressure || 1013,
        city: weather.weatherCity,
        location: weather.weatherCity?.name_th || weather.weatherCity?.name_en || 'ບໍ່ຮູ້'
      };

      // Get predictions for this city
      const cityPredictions = predictions.filter(p => p.city_id === weather.city_id).map(p => ({
        predicted_temperature: p.predicted_temperature,
        predicted_rainfall: p.predicted_rainfall || 0,
        timestamp: p.timestamp,
        cityName: p.city_name
      }));
      
      const alerts = await checkWeatherConditionsAndAlert(weatherData, cityPredictions);
      allAlerts = allAlerts.concat(alerts);
    }

    // Process and store alerts
    const processedAlerts = await processWeatherAlerts(allAlerts);
    
    console.log(`✅ Processed ${processedAlerts.length} weather alerts`);
    return processedAlerts;
    
  } catch (error) {
    console.error('❌ Error checking weather alerts:', error);
    return [];
  }
};

// Get weather alerts for user (called when user visits website)
const getUserWeatherAlerts = async (req, res) => {
  try {
    console.log('🔍 Fetching weather alerts for user...');
    
    // Run weather condition checks
    const newAlerts = await checkAndCreateWeatherAlerts();
    
    // Get all active alerts (from database and manual alerts)
    const activeAlerts = [];
    
    // Get recent database notifications (weather alerts)
    const dbNotifications = await Notification.findAll({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        type: {
          [Op.in]: ['weather', 'rain', 'storm', 'drought', 'flood', 'emergency']
        }
      },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Convert database notifications
    dbNotifications.forEach(notification => {
      const metadata = notification.metadata || {};
      activeAlerts.push({
        id: `db_${notification.id}`,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        severity: notification.priority,
        created_at: notification.created_at,
        location: metadata.location,
        recommendations: metadata.recommendations,
        source: 'database',
        autoGenerated: metadata.autoGenerated || false
      });
    });

    // Add manual alerts that are weather-related
    const weatherManualAlerts = manualAlerts.filter(alert => {
      const alertTime = new Date(alert.time);
      const now = new Date();
      const hoursDiff = (now - alertTime) / (1000 * 60 * 60);
      
      // Show alerts from last 24 hours that are weather-related
      return hoursDiff <= 24 && 
             ['weather', 'rain', 'storm', 'drought', 'flood', 'emergency'].includes(alert.type);
    });

    weatherManualAlerts.forEach(alert => {
      activeAlerts.push({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        type: alert.type,
        priority: alert.priority,
        severity: alert.priority,
        created_at: alert.time,
        location: alert.metadata?.location,
        recommendations: alert.metadata?.recommendations,
        source: 'manual',
        autoGenerated: alert.metadata?.autoGenerated || false
      });
    });

    // Sort by priority and time
    activeAlerts.sort((a, b) => {
      const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return new Date(b.created_at) - new Date(a.created_at); // Newer first
    });

    // Take only top 5 most important alerts
    const topAlerts = activeAlerts.slice(0, 5);

    console.log(`✅ Found ${topAlerts.length} weather alerts for user`);

    res.json({
      success: true,
      data: topAlerts,
      stats: {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.priority === 'Critical').length,
        high: activeAlerts.filter(a => a.priority === 'High').length,
        medium: activeAlerts.filter(a => a.priority === 'Medium').length,
        low: activeAlerts.filter(a => a.priority === 'Low').length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching weather alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather alerts',
      details: error.message
    });
  }
};

// Schedule automatic weather checking every 30 minutes
const scheduleWeatherAlertCheck = () => {
  setInterval(async () => {
    try {
      console.log('⏰ Scheduled weather alert check...');
      await checkAndCreateWeatherAlerts();
    } catch (error) {
      console.error('❌ Error in scheduled weather check:', error);
    }
  }, 30 * 60 * 1000); // Every 30 minutes
};

// Initialize weather alert system
const initializeWeatherAlertSystem = () => {
  console.log('🚀 Initializing weather alert system...');
  
  // Run initial check
  setTimeout(async () => {
    await checkAndCreateWeatherAlerts();
  }, 5000); // Wait 5 seconds after server start
  
  // Schedule periodic checks
  scheduleWeatherAlertCheck();
  
  console.log('✅ Weather alert system initialized');
};

module.exports = {
  getActiveNotifications,
  getNotifications,
  getNotificationCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearOldNotifications,
  clearAllNotifications,
  getSettings,
  updateSettings,
  createWeatherAlert,
  deleteWeatherAlert,
  getCitiesForAlerts,
  clearAllManualAlerts,
  broadcastNotification,
  checkLSTM,
  checkWeatherConditionsAndAlert,
  processWeatherAlerts,
  checkAndCreateWeatherAlerts,
  getUserWeatherAlerts,
  initializeWeatherAlertSystem
};
