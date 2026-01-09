// backend/routes/cityRoutes.js
const express  = require('express');
const router   = express.Router();
const { City, Province } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/inputValidation');

// Protect all routes with authentication
router.use(verifyToken);

// GET /api/cities — ดึงทุกเมือง พร้อมชื่อจังหวัดและพิกัด
router.get('/', validatePagination, async (req, res) => {
  try {
    const cities = await City.findAll({
      attributes: ['id', 'name_th', 'name_en', 'lat', 'lon', 'province_id', 'region'],
      include: [{
        model: Province,
        as: 'province',
        attributes: ['name']
      }],
      order: [['name_th', 'ASC']]
    });
    
    // แปลงข้อมูลให้เข้ากับ frontend พร้อมข้อมูล weather status
    const formattedCities = cities.map(city => ({
      id: city.id,
      name: city.name_th,
      name_th: city.name_th,
      name_en: city.name_en,
      latitude: city.lat,
      longitude: city.lon,
      province_id: city.province_id,
      provinceName: city.province ? city.province.name : '',
      hasWeatherData: false, // This would be calculated based on actual weather data
      testingWeather: false,
      testingLSTM: false
    }));
    
    res.json(formattedCities);
  } catch (err) {
    console.error('Get cities error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเมือง' });
  }
});

// POST /api/cities — สร้างเมืองใหม่
router.post('/', async (req, res) => {
  try {
    const { name, latitude, longitude, status, region, provinceId } = req.body;
    
    // Validate required fields
    if (!name || !latitude || !longitude) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน (name, latitude, longitude ต้องมี)' });
    }
    
    // Validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'พิกัดไม่ถูกต้อง' });
    }
    
    const city = await City.create({
      name_th: name,
      name_en: name,
      lat: lat,
      lon: lon,
      province_id: provinceId || null,
      region: region || 'Central'
    });
    
    res.status(201).json(city);
  } catch (err) {
    console.error('Create city error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างเมือง' });
  }
});

// PUT /api/cities/:id — แก้ไขเมือง
router.put('/:id', async (req, res) => {
  try {
    const { name, latitude, longitude, status, region, provinceId } = req.body;
    const city = await City.findByPk(req.params.id);
    
    if (!city) {
      return res.status(404).json({ error: 'ไม่พบเมืองนี้' });
    }
    
    // Validate coordinates if provided
    if (latitude !== undefined || longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ error: 'พิกัดไม่ถูกต้อง' });
      }
    }
    
    await city.update({
      name_th: name || city.name_th,
      name_en: name || city.name_en,
      lat: latitude ? parseFloat(latitude) : city.lat,
      lon: longitude ? parseFloat(longitude) : city.lon,
      province_id: provinceId || city.province_id,
      region: region || city.region
    });
    
    res.json(city);
  } catch (err) {
    console.error('Update city error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขเมือง' });
  }
});

// DELETE /api/cities/:id — ลบเมือง
router.delete('/:id', async (req, res) => {
  try {
    const city = await City.findByPk(req.params.id);
    if (!city) {
      return res.status(404).json({ error: 'ไม่พบเมืองนี้' });
    }
    
    await city.destroy();
    res.json({ message: 'ลบเมืองสำเร็จ' });
  } catch (err) {
    console.error('Delete city error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบเมือง' });
  }
});

// POST /api/cities/bulk-update — อัปเดตข้อมูลหลายเมืองพร้อมกัน
router.post('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates array is required' });
    }
    
    const results = [];
    const errors = [];
    
    // Process updates in parallel
    const promises = updates.map(async (update) => {
      try {
        const { id, name, latitude, longitude, stationCode, status, region, provinceId } = update;
        
        const city = await City.findByPk(id);
        if (!city) {
          errors.push({ id, error: 'City not found' });
          return;
        }
        
        await city.update({
          name_th: name || city.name_th,
          name_en: name || city.name_en,
          lat: latitude ? parseFloat(latitude) : city.lat,
          lon: longitude ? parseFloat(longitude) : city.lon,
          region: region || city.region,
          province_id: provinceId || city.province_id
        });
        
        results.push({ id, success: true });
      } catch (error) {
        console.error(`Error updating city ${update.id}:`, error);
        errors.push({ id: update.id, error: error.message });
      }
    });
    
    await Promise.all(promises);
    
    res.json({
      success: true,
      message: `Updated ${results.length} cities successfully`,
      updated: results.length,
      errors: errors.length,
      details: { results, errors }
    });
    
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to bulk update cities' });
  }
});

module.exports = router;