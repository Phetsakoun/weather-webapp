const express = require('express');

const router = express.Router();
const newsController = require('../controllers/newsController');
const { verifyToken } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/public', newsController.getPublicNews); // Public read admin-only published news
router.get('/public/count', async (req, res) => {
  try {
    const News = require('../models/newsModel');
    const count = await News.count();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching news count:', error);
    res.json({ count: 12 }); // fallback
  }
});

// Protected routes (authentication required)
router.post('/', verifyToken, newsController.createNews); // Create
router.get('/', verifyToken, newsController.getAllNews); // Read all (admin)
router.get('/:id', verifyToken, newsController.getNewsById); // Read one
router.put('/:id', verifyToken, newsController.updateNews); // Update
router.delete('/:id', verifyToken, newsController.deleteNews); // Delete

module.exports = router;
