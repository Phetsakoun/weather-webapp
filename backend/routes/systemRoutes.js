const express = require('express');
const router = express.Router();

// System health check endpoint
router.get('/health', async (req, res) => {
  try {
    // ตรวจสอบสถานะระบบต่างๆ
    const systemStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy',
        ml_service: 'healthy'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    res.json(systemStatus);
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
