const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// สร้างผู้ใช้ใหม่
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role, status } = req.body;
        
        // Validate required fields
        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'Username, email, password, and role are required' });
        }

        // Check if user already exists
        const { Op } = require('sequelize');
        const existingUser = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await User.create({ 
            username, 
            email, 
            password: hashedPassword,
            role: role || 'viewer',
            status: status || 'active'
        });

        // Remove password from response
        const { password: _, ...userResponse } = user.toJSON();
        res.status(201).json(userResponse);
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ดึงผู้ใช้ทั้งหมด
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ 
            attributes: { exclude: ['password'] }, // Don't return passwords
            order: [['created_at', 'DESC']] 
        });
        res.json(users);
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ดึงผู้ใช้ตาม ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] } // Don't return password
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Get user by ID error:', err);
        res.status(500).json({ error: err.message });
    }
};

// อัปเดตผู้ใช้
exports.updateUser = async (req, res) => {
    try {
        const { username, email, role, status, password } = req.body;
        const user = await User.findByPk(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if username or email already exists for other users
        if (username || email) {
            const { Op } = require('sequelize');
            const existingUser = await User.findOne({ 
                where: { 
                    id: { [Op.ne]: req.params.id }, // Exclude current user
                    [Op.or]: [
                        ...(username ? [{ username: username }] : []),
                        ...(email ? [{ email: email }] : [])
                    ]
                }
            });

            if (existingUser) {
                return res.status(409).json({ error: 'Username or email already exists' });
            }
        }

        // Prepare update data
        const updateData = {
            username: username || user.username,
            email: email || user.email,
            role: role || user.role,
            status: status || user.status
        };

        // Hash new password if provided
        if (password && password.trim()) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(password.trim(), saltRounds);
        }

        // Update user fields
        const updatedUser = await user.update(updateData);

        // Remove password from response
        const { password: _, ...userResponse } = updatedUser.toJSON();
        res.json(userResponse);
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ลบผู้ใช้
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting admin users (optional security measure)
        if (user.role === 'admin' && user.username === 'admin') {
            return res.status(403).json({ error: 'Cannot delete default admin user' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: err.message });
    }
};
