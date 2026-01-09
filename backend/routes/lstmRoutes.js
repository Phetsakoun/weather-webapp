const express = require('express');

const router = express.Router();
const {
  getLSTMPredictions,
  triggerManualPrediction,
  runAutoLSTMPredictions,
  cleanupOldPredictions,
  getHistoricalDataAPI,
} = require('../controllers/lstmController');

// ກຸ້ມ API endpoints ສໍາລັບການຈັດການການທໍານາຍ LSTM

// GET /api/lstm/predictions - ດຶງຂໍ້ມູນການທໍານາຍ LSTM
router.get('/predictions', getLSTMPredictions);

// GET /api/lstm/historical - ດຶງຂໍ້ມູນປະຫວັດສາດສໍາລັບ LSTM
router.get('/historical', getHistoricalDataAPI);

// POST /api/lstm/predict - ເຮັດການທໍານາຍດ້ວຍຕົນເອງ
router.post('/predict', triggerManualPrediction);

// POST /api/lstm/run-all - ເຮັດການທໍານາຍສໍາລັບທຸກເມືອງ
router.post('/run-all', async (req, res) => {
  try {
    // ການກໍານົດເມືອງທີ່ຈະທໍານາຍ (ຄວນຢູ່ໃນ configuration)
    const cityConfigs = [
      {
        cityId: 1, city: 'ວຽງຈັນ', lat: 17.9757, lon: 102.6331,
      },
      {
        cityId: 2, city: 'ຫຼວງພະບາງ', lat: 19.8833, lon: 102.1333,
      },
      {
        cityId: 3, city: 'ປາກເຊ', lat: 15.1202, lon: 105.7994,
      },
      {
        cityId: 4, city: 'ສວັນນະເຂດ', lat: 17.4104, lon: 104.7800,
      },
      {
        cityId: 5, city: 'ຈໍາປາສັກ', lat: 14.5565, lon: 105.9717,
      },
      {
        cityId: 6, city: 'ອັດຕະປື', lat: 14.8095, lon: 106.4252,
      },
      {
        cityId: 7, city: 'ຫົວພັນ', lat: 20.2675, lon: 104.2831,
      },
      {
        cityId: 8, city: 'ສາລະວັນ', lat: 15.7142, lon: 106.4131,
      },
      {
        cityId: 9, city: 'ເຊກອງ', lat: 16.5632, lon: 106.7508,
      },
      {
        cityId: 10, city: 'ບໍ່ແກ້ວ', lat: 18.2674, lon: 105.1217,
      },
      {
        cityId: 11, city: 'ຄໍາມ່ວນ', lat: 19.4260, lon: 101.6625,
      },
      {
        cityId: 12, city: 'ໄຊສົມບູນ', lat: 20.2554, lon: 103.8176,
      },
      {
        cityId: 13, city: 'ພົງສາລີ', lat: 21.4067, lon: 102.0703,
      },
      {
        cityId: 14, city: 'ອຸດົມໄຊ', lat: 18.3568, lon: 101.6850,
      },
      {
        cityId: 15, city: 'ຊຽງຂວາງ', lat: 19.4503, lon: 103.2544,
      },
      {
        cityId: 16, city: 'ຫຼວງນໍ້າທາ', lat: 20.9342, lon: 101.4014,
      },
      {
        cityId: 17, city: 'ບໍລິຄໍາໄຊ', lat: 18.2716, lon: 104.2836,
      },
      {
        cityId: 18, city: 'ວຽງຄໍາ', lat: 15.9301, lon: 105.9149,
      },
    ];

    const results = await runAutoLSTMPredictions(cityConfigs);

    res.json({
      success: true,
      message: 'ການທໍານາຍອັດຕະໂນມັດສໍາລັບທຸກເມືອງສຳເລັດແລ້ວ',
      results,
    });
  } catch (error) {
    console.error('Error in run-all predictions:', error);
    res.status(500).json({
      success: false,
      error: 'ເກີດຂໍ້ຜິດພາດໃນການທໍານາຍ',
      details: error.message,
    });
  }
});

// DELETE /api/lstm/cleanup - ລຶບຂໍ້ມູນການທໍານາຍເກົ່າ
router.delete('/cleanup', async (req, res) => {
  try {
    const deletedCount = await cleanupOldPredictions();

    res.json({
      success: true,
      message: 'ລຶບຂໍ້ມູນເກົ່າສຳເລັດແລ້ວ',
      deletedCount,
    });
  } catch (error) {
    console.error('Error in cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'ເກີດຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນເກົ່າ',
      details: error.message,
    });
  }
});

// GET /api/lstm/status - ກວດສອບສະຖານະລະບົບ LSTM
router.get('/status', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const sequelize = require('../config/database');
    const WeatherForecast = require('../models/weatherForecastModel');

    // ນັບຈຳນວນການທໍານາຍໃນວັນນີ້
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayQuery = `
      SELECT COUNT(*) as count 
      FROM weatherforecast 
      WHERE description LIKE '%LSTM Prediction%' 
      AND created_at >= ? AND created_at < ?
    `;

    const [todayResult] = await sequelize.query(todayQuery, {
      replacements: [today, tomorrow],
      type: sequelize.QueryTypes.SELECT,
    });

    const todayPredictions = todayResult.count;

    // ນັບຈຳນວນການທໍານາຍທັງໝົດ
    const totalQuery = `
      SELECT COUNT(*) as count 
      FROM weatherforecast 
      WHERE description LIKE '%LSTM Prediction%'
    `;

    const [totalResult] = await sequelize.query(totalQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    const totalPredictions = totalResult.count;

    // ຫາການທໍານາຍຫຼ້າສຸດ
    const latestQuery = `
      SELECT created_at 
      FROM weatherforecast 
      WHERE description LIKE '%LSTM Prediction%' 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const [latestResult] = await sequelize.query(latestQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    const latestPrediction = latestResult ? latestResult.created_at : null;

    res.json({
      success: true,
      status: {
        systemActive: true,
        todayPredictions,
        totalPredictions,
        latestPrediction,
        scheduledJobsActive: true,
      },
    });
  } catch (error) {
    console.error('Error getting LSTM status:', error);
    res.status(500).json({
      success: false,
      error: 'ເກີດຂໍ້ຜິດພາດໃນການກວດສອບສະຖານະ',
      details: error.message,
    });
  }
});

module.exports = router;
