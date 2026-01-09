const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const User   = require('../models/userModel'); // เปลี่ยน path ถ้าไม่ตรง

// REGISTER (สร้างผู้ใช้ใหม่)
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'ต้องกรอก username และ password' });
    }
    // ตรวจ username ซ้ำ
    const found = await User.findOne({ where: { username } });
    if (found) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
    }
    // Hash password
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hash,
      role: role || 'user' // ถ้าไม่กำหนด, default เป็น user
    });
    res.json({ message: 'สมัครสมาชิกสำเร็จ', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดระหว่างสมัครสมาชิก' });
  }
};

// LOGIN (เข้าสู่ระบบ)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }
    
    // Find user by username
    const user = await User.findOne({ 
      where: { username: username } 
    });
    
    if (!user) {
      return res.status(401).json({ message: 'ไม่พบผู้ใช้นี้ในระบบ' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }
    
    // Ensure JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set in environment');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    // สร้าง JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    
    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      username: user.username,
      role: user.role,
      userId: user.id,
      redirectUrl: user.role === 'admin' ? '/admin' : '/'
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะเข้าสู่ระบบ' });
  }
};

// LOGOUT (ออกจากระบบ)
exports.logout = async (req, res) => {
  try {
    // For JWT, logout is typically handled on the client side
    // by removing the token from storage
    res.json({ message: 'ออกจากระบบสำเร็จ' });
  } catch (err) {
    console.error('logout error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะออกจากระบบ' });
  }
};

// VERIFY TOKEN (ตรวจสอบ token)
exports.verifyToken = async (req, res) => {
  try {
    // Token verification is handled by middleware
    // If we reach here, token is valid
    res.json({
      message: 'Token valid',
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error('verify token error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะตรวจสอบ token' });
  }
};

// GET CURRENT USER PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('get profile error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะดึงข้อมูลผู้ใช้' });
  }
};

// GET ALL USERS (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
    
    res.json(users);
  } catch (err) {
    console.error('get all users error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะดึงข้อมูลผู้ใช้ทั้งหมด' });
  }
};
