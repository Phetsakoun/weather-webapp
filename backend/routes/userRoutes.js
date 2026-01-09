const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/userModel');

// Public endpoint to get user count (no authentication required)
router.get('/public/count', async (req, res) => {
  try {
    console.log('🔍 Fetching public user count...');
    const userCount = await User.count({
      where: {
        status: 'active' // Only count active users
      }
    });
    console.log('✅ Found', userCount, 'active users');
    res.json({ count: userCount });
  } catch (error) {
    console.error('❌ Error fetching user count:', error);
    // Return fallback count
    res.json({ count: 0 });
  }
});

// Protect all other user routes with authentication
router.use(verifyToken);

// CRUD routes for users
router.post('/', userController.createUser);        // Create
router.get('/', userController.getAllUsers);        // Read all
router.get('/:id', userController.getUserById);     // Read one
router.put('/:id', userController.updateUser);      // Update
router.delete('/:id', userController.deleteUser);   // Delete

module.exports = router;
