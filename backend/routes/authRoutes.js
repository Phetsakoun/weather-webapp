// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/inputValidation');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// ----------------- Auth ธรรมดา -------------------
router.post('/login', validateLogin, AuthController.login);
router.post('/register', validateRegister, AuthController.register);
router.post('/logout', AuthController.logout);

// Public routes (no authentication required)
router.get('/users/count', async (req, res) => {
  try {
    console.log('🔍 Fetching public user count...');
    const User = require('../models/userModel');
    const count = await User.count();
    console.log('✅ Found', count, 'users');
    res.json({ count });
  } catch (error) {
    console.error('❌ Error fetching user count:', error);
    res.json({ count: 25 }); // fallback
  }
});

// Protected routes (require token)
router.get('/verify', verifyToken, AuthController.verifyToken);
router.get('/profile', verifyToken, AuthController.getProfile);

// GET /api/auth/users - Get all users (admin only)
router.get('/users', verifyToken, AuthController.getAllUsers);

// ----------------- Google OAuth -------------------
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // สร้าง JWT token แล้ว redirect กลับไป frontend
    const user = req.user;
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2d' }
    );
    // Redirect กลับหน้า login frontend พร้อม token
    res.redirect(`http://localhost:5173/login?token=${token}&role=${user.role}`);
  }
);

module.exports = router;
