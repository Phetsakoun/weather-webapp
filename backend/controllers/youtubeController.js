const YouTube = require('../models/youtubeModel');

// เพิ่มวิดีโอ YouTube
exports.createYouTube = async (req, res) => {
  try {
    console.log('=== DEBUG: Creating YouTube video ===');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);

    const {
      title, description, youtube_url, thumbnail_url, is_featured, status,
    } = req.body;

    // Check if user is admin or superadmin
    const isAdmin = req.user && ['admin', 'superadmin'].includes(req.user.role);

    const youtubeData = {
      title,
      description,
      youtube_url,
      thumbnail_url,
      is_featured: is_featured || false,
      status: status || 'published',
      created_by: req.user ? req.user.id : null,
      is_admin_content: isAdmin,
    };

    const youtube = await YouTube.create(youtubeData);

    console.log('Created YouTube video:', youtube);
    res.status(201).json(youtube);
  } catch (err) {
    console.error('=== DEBUG: Create YouTube error ===');
    console.error('Error details:', err);
    res.status(500).json({ error: err.message });
  }
};

// ดึงวิดีโอ YouTube ทั้งหมด (สำหรับ admin)
exports.getAllYouTube = async (req, res) => {
  try {
    console.log('=== DEBUG: Getting all YouTube videos (admin) ===');
    const videos = await YouTube.findAll({ order: [['created_at', 'DESC']] });
    console.log('Found YouTube videos count:', videos.length);
    res.json(videos);
  } catch (err) {
    console.error('=== DEBUG: Get all YouTube error ===');
    console.error('Error details:', err);
    res.status(500).json({ error: err.message });
  }
};

// ดึงวิดีโอ YouTube สำหรับ public (เฉพาะที่แอดมินอัปโหลด)
exports.getPublicYouTube = async (req, res) => {
  try {
    console.log('=== DEBUG: Getting public YouTube videos (admin content only) ===');
    const videos = await YouTube.findAll({
      where: {
        status: 'published',
        is_admin_content: true,
      },
      order: [['created_at', 'DESC']],
    });
    console.log('Found public admin YouTube videos count:', videos.length);
    console.log('Public YouTube videos:', videos);
    res.json(videos);
  } catch (err) {
    console.error('=== DEBUG: Get public YouTube error ===');
    console.error('Error details:', err);
    res.status(500).json({ error: err.message });
  }
};

// ดึงวิดีโอ YouTube ตาม ID
exports.getYouTubeById = async (req, res) => {
  try {
    const video = await YouTube.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'YouTube video not found' });
    }
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// อัปเดตวิดีโอ YouTube
exports.updateYouTube = async (req, res) => {
  try {
    const {
      title, description, youtube_url, thumbnail_url, is_featured,
    } = req.body;
    const video = await YouTube.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'YouTube video not found' });
    }

    await video.update({
      title,
      description,
      youtube_url,
      thumbnail_url,
      is_featured,
    });

    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ลบวิดีโอ YouTube
exports.deleteYouTube = async (req, res) => {
  try {
    const video = await YouTube.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'YouTube video not found' });
    }

    await video.destroy();
    res.json({ message: 'YouTube video deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
