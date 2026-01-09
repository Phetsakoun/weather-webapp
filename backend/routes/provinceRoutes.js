const express = require('express');

const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Province, City } = require('../models');
const { verifyToken } = require('../middleware/auth');

// GET /api/provinces/public - Get basic province count (no auth required)
router.get('/public', async (req, res) => {
  try {
    console.log('🔍 Fetching public province count...');
    const provinceCount = await Province.count();
    console.log('✅ Found', provinceCount, 'provinces');
    res.json({ count: provinceCount });
  } catch (error) {
    console.error('❌ Error fetching province count:', error);
    // Return fallback count
    res.json({ count: 18 });
  }
});

// GET /api/provinces/public/locations - Get provinces with active cities for public use (no auth required)
router.get('/public/locations', async (req, res) => {
  try {
    console.log('🔍 Fetching public province locations...');

    // Use raw query to get only active cities for public use
    const [results] = await sequelize.query(`
      SELECT 
        p.id as province_id,
        p.name_th as province_name_th,
        p.name_en as province_name_en,
        c.id as city_id,
        c.name_th as city_name_th,
        c.name_en as city_name_en,
        c.lat,
        c.lon,
        c.region,
        c.status
      FROM provinces p
      INNER JOIN cities c ON p.id = c.province_id
      WHERE c.lat IS NOT NULL 
        AND c.lon IS NOT NULL 
        AND c.lat != 0 
        AND c.lon != 0
        AND c.status = 'active'
      ORDER BY p.name_th ASC, c.name_th ASC
    `);

    // Transform the flat result into nested structure
    const provincesMap = new Map();

    results.forEach((row) => {
      const provinceId = row.province_id;

      if (!provincesMap.has(provinceId)) {
        provincesMap.set(provinceId, {
          id: row.province_id,
          name_th: row.province_name_th,
          name_en: row.province_name_en,
          cities: [],
        });
      }

      provincesMap.get(provinceId).cities.push({
        id: row.city_id,
        name_th: row.city_name_th,
        name_en: row.city_name_en,
        lat: row.lat,
        lon: row.lon,
        region: row.region,
      });
    });

    const provinces = Array.from(provincesMap.values());
    const totalCities = provinces.reduce((total, p) => total + p.cities.length, 0);

    console.log(`✅ Found ${provinces.length} provinces with ${totalCities} active cities`);
    res.json(provinces);
  } catch (error) {
    console.error('❌ Error fetching public province locations:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to fetch province locations', details: error.message });
  }
});

// GET /api/provinces - Get all provinces
router.get('/', verifyToken, async (req, res) => {
  try {
    const provinces = await Province.findAll({
      include: [{
        model: City,
        as: 'cities',
        attributes: ['id', 'name_th', 'name_en', 'lat', 'lon', 'province_id', 'region', 'status'],
      }],
      order: [['name_th', 'ASC']],
    });

    res.json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
});

// GET /api/provinces/:id - Get province by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const province = await Province.findByPk(req.params.id, {
      include: [{
        model: City,
        as: 'cities',
        attributes: ['id', 'name_th', 'name_en', 'lat', 'lon', 'province_id', 'region', 'status'],
      }],
    });

    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }

    res.json(province);
  } catch (error) {
    console.error('Error fetching province:', error);
    res.status(500).json({ error: 'Failed to fetch province' });
  }
});

// GET /api/provinces/count - Get provinces count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const count = await Province.count();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching provinces count:', error);
    res.status(500).json({ error: 'Failed to fetch provinces count', count: 0 });
  }
});

// POST /api/provinces - Create new province
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Province name is required' });
    }

    // ตรวจสอบชื่อซ้ำ
    const existingProvince = await Province.findOne({
      where: {
        [Op.or]: [
          { name_th: { [Op.like]: name } },
          { name_en: { [Op.like]: name } },
        ],
      },
    });

    if (existingProvince) {
      return res.status(409).json({ error: 'Province name already exists' });
    }

    const province = await Province.create({
      name_th: name,
      name_en: name,
    });
    res.status(201).json(province);
  } catch (error) {
    console.error('Error creating province:', error);
    res.status(500).json({ error: 'Failed to create province' });
  }
});

// PUT /api/provinces/:id - Update province
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Province name is required' });
    }

    const province = await Province.findByPk(req.params.id);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }

    // ตรวจสอบชื่อซ้ำ (ยกเว้นตัวเอง)
    const existingProvince = await Province.findOne({
      where: {
        [Op.or]: [
          { name_th: { [Op.like]: name } },
          { name_en: { [Op.like]: name } },
        ],
        id: { [Op.ne]: req.params.id },
      },
    });

    if (existingProvince) {
      return res.status(409).json({ error: 'Province name already exists' });
    }

    await province.update({
      name_th: name,
      name_en: name,
    });
    res.json(province);
  } catch (error) {
    console.error('Error updating province:', error);
    res.status(500).json({ error: 'Failed to update province' });
  }
});

// DELETE /api/provinces/:id - Delete province
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const province = await Province.findByPk(req.params.id);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }

    // ตรวจสอบว่ามีเมืองในจังหวัดนี้หรือไม่
    const cityCount = await City.count({
      where: { province_id: req.params.id },
    });

    if (cityCount > 0) {
      return res.status(400).json({
        error: `Cannot delete province. It has ${cityCount} cities. Please delete all cities first.`,
      });
    }

    await province.destroy();
    res.json({ message: 'Province deleted successfully' });
  } catch (error) {
    console.error('Error deleting province:', error);
    res.status(500).json({ error: 'Failed to delete province' });
  }
});

// GET /api/provinces/:id/cities - Get cities in specific province
router.get('/:id/cities', verifyToken, async (req, res) => {
  try {
    const province = await Province.findByPk(req.params.id);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }

    const cities = await City.findAll({
      where: { province_id: req.params.id },
      order: [['name_th', 'ASC']],
    });

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// POST /api/provinces/:id/cities - Add city to specific province
router.post('/:id/cities', verifyToken, async (req, res) => {
  try {
    const {
      name, latitude, longitude, region,
    } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    }

    const province = await Province.findByPk(req.params.id);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }

    // ตรวจสอบชื่อเมืองซ้ำในจังหวัดเดียวกัน
    const existingCity = await City.findOne({
      where: {
        [Op.or]: [
          { name_th: { [Op.like]: name } },
          { name_en: { [Op.like]: name } },
        ],
        province_id: req.params.id,
      },
    });

    if (existingCity) {
      return res.status(409).json({ error: 'City name already exists in this province' });
    }

    const city = await City.create({
      name_th: name,
      name_en: name,
      lat: parseFloat(latitude),
      lon: parseFloat(longitude),
      province_id: req.params.id,
      region: region || 'Central',
      status: 'active', // เมืองใหม่จะเป็น active โดยอัตโนมัติ
    });

    res.status(201).json(city);
  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({ error: 'Failed to create city' });
  }
});

// PUT /api/provinces/cities/:cityId/status - Update city status (เปิด/ปิดการใช้งานเมือง)
router.put('/cities/:cityId/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
    }

    const city = await City.findByPk(req.params.cityId, {
      include: [{
        model: Province,
        as: 'province',
        attributes: ['id', 'name_th', 'name_en'],
      }],
    });

    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    const oldStatus = city.status;
    await city.update({ status });

    console.log(`✅ Updated city ${city.name_th} status from ${oldStatus} to ${status}`);

    res.json({
      message: `City status updated to ${status}`,
      city: {
        id: city.id,
        name_th: city.name_th,
        name_en: city.name_en,
        status: city.status,
        province: city.province,
      },
    });
  } catch (error) {
    console.error('Error updating city status:', error);
    res.status(500).json({ error: 'Failed to update city status' });
  }
});

// GET /api/provinces/cities - Get all cities with status filter
router.get('/cities', verifyToken, async (req, res) => {
  try {
    const { status, search, region } = req.query;

    const whereClause = {};

    if (status && ['active', 'inactive'].includes(status)) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name_th: { [Op.like]: `%${search}%` } },
        { name_en: { [Op.like]: `%${search}%` } },
      ];
    }

    if (region) {
      whereClause.region = region;
    }

    const cities = await City.findAll({
      where: whereClause,
      include: [{
        model: Province,
        as: 'province',
        attributes: ['id', 'name_th', 'name_en'],
      }],
      order: [['name_th', 'ASC']],
    });

    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// POST /api/provinces/cities/bulk-status - Update multiple cities status at once
router.post('/cities/bulk-status', verifyToken, async (req, res) => {
  try {
    const { cityIds, status } = req.body;

    if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
      return res.status(400).json({ error: 'cityIds array is required' });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
    }

    const updatedCities = await City.update(
      { status },
      {
        where: { id: { [Op.in]: cityIds } },
        returning: true,
      },
    );

    console.log(`✅ Updated ${updatedCities[0]} cities to ${status} status`);

    res.json({
      message: `Updated ${updatedCities[0]} cities to ${status}`,
      updatedCount: updatedCities[0],
    });
  } catch (error) {
    console.error('Error bulk updating city status:', error);
    res.status(500).json({ error: 'Failed to update cities status' });
  }
});

module.exports = router;
