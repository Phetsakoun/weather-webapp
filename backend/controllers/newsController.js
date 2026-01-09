const News = require('../models/newsModel');

// เพิ่มข่าวสาร
exports.createNews = async (req, res) => {
    try {
        console.log('=== DEBUG: Creating news ===');
        console.log('Request body:', req.body);
        console.log('Request user:', req.user);
        
        const { title, description, youtube_url, image_url, is_highlight, status } = req.body;
        
        // Check if user is admin or superadmin
        const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);
        
        console.log('Extracted data:', { title, description, youtube_url, image_url, is_highlight, status });
        console.log('User is admin:', isAdmin);
        
        const newsData = { 
            title, 
            description, 
            youtube_url, 
            image_url, 
            is_highlight: is_highlight || false,
            status: status || 'published',
            created_by: req.user ? req.user.id : null,
            is_admin_content: isAdmin
        };
        
        const news = await News.create(newsData);
        
        console.log('Created news:', news);
        res.status(201).json(news);
    } catch (err) {
        console.error('=== DEBUG: Create news error ===');
        console.error('Error details:', err);
        res.status(500).json({ error: err.message });
    }
};

// ดึงข่าวสารทั้งหมด (สำหรับ admin)
exports.getAllNews = async (req, res) => {
    try {
        console.log('=== DEBUG: Getting all news (admin) ===');
        const news = await News.findAll({ order: [['created_at', 'DESC']] });
        console.log('Found news count:', news.length);
        console.log('News data:', news);
        res.json(news);
    } catch (err) {
        console.error('=== DEBUG: Get all news error ===');
        console.error('Error details:', err);
        res.status(500).json({ error: err.message });
    }
};

// ดึงข่าวสารสำหรับ public (เฉพาะที่แอดมินอัปโหลด)
exports.getPublicNews = async (req, res) => {
    try {
        console.log('=== DEBUG: Getting public news (admin content only) ===');
        const news = await News.findAll({ 
            where: {
                status: 'published',
                is_admin_content: true
            },
            order: [['created_at', 'DESC']] 
        });
        console.log('Found public admin news count:', news.length);
        console.log('Public news data:', news);
        res.json(news);
    } catch (err) {
        console.error('=== DEBUG: Get public news error ===');
        console.error('Error details:', err);
        res.status(500).json({ error: err.message });
    }
};

// ดึงข่าวสารตาม ID
exports.getNewsById = async (req, res) => {
    try {
        const news = await News.findByPk(req.params.id);
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// อัปเดตข่าวสาร
exports.updateNews = async (req, res) => {
    try {
        const { title, description, youtube_url, image_url, is_highlight } = req.body;
        const news = await News.findByPk(req.params.id);
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }
        
        await news.update({
            title,
            description,
            youtube_url,
            image_url,
            is_highlight
        });
        
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ลบข่าวสาร
exports.deleteNews = async (req, res) => {
    try {
        const news = await News.findByPk(req.params.id);
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }
        
        await news.destroy();
        res.json({ message: 'News deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
