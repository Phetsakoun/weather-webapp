const express = require('express');

const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const { verifyToken } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/public', youtubeController.getPublicYouTube); // Public read admin-only published YouTube videos

// Protected routes (authentication required)
router.post('/', verifyToken, youtubeController.createYouTube); // Create
router.get('/', verifyToken, youtubeController.getAllYouTube); // Read all (admin)
router.get('/:id', verifyToken, youtubeController.getYouTubeById); // Read one
router.put('/:id', verifyToken, youtubeController.updateYouTube); // Update
router.delete('/:id', verifyToken, youtubeController.deleteYouTube); // Delete

module.exports = router;
