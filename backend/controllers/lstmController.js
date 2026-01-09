const axios = require('axios');
const cron = require('node-cron');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Weather = require('../models/weatherModel');
const WeatherForecast = require('../models/weatherForecastModel');

// LSTM API configuration
const LSTM_API_BASE_URL = process.env.LSTM_API_URL || 'http://127.0.0.1:5001';

// ຟັງຊັນດຶງຂໍ້ມູນປະຫວັດສາດຈາກ weather table
const persistence = require('../services/weatherPersistence');

async function getHistoricalWeatherData(cityId, days = 30) {
  try {
    console.log(`📊 Fetching historical weather data for city ${cityId} (last ${days} days)`);
    const historicalData = await persistence.getHistoricalWeatherData(cityId, days, 1000);
    console.log(`✅ Retrieved ${historicalData.length} historical weather records`);
    return historicalData;
  } catch (error) {
    console.error('❌ Error fetching historical weather data:', error.message);
    throw error;
  }
}

// ຟັງຊັນດຶງຂໍ້ມູນສະຖິຕິສໍາລັບ LSTM
async function getWeatherStatistics(cityId, days = 30) {
  try {
    const stats = await persistence.getWeatherStatistics(cityId, days);
    return stats;
  } catch (error) {
    console.error('❌ Error fetching weather statistics:', error.message);
    return null;
  }
}

// ຟັງຊັນເຕືອມຂໍ້ມູນປະຫວັດສາດສໍາລັບ LSTM
function formatHistoricalDataForLSTM(historicalData) {
  if (!historicalData || historicalData.length === 0) {
    return null;
  }
  
  return historicalData.map(record => ({
    timestamp: record.recorded_at,
    temperature: record.temperature,
    humidity: record.humidity,
    pressure: record.pressure,
    wind_speed: record.wind_speed,
    rainfall: record.rainfall,
    description: record.description
  }));
}

// ຟັງຊັນເອີ້ນ LSTM API ເພື່ອຮັບການທໍານາຍ
async function callLSTMAPI(lat, lon, cityId = null) {
  try {
    console.log(`🔍 Calling LSTM API for coordinates: ${lat}, ${lon}`);
    
    // ດຶງຂໍ້ມູນປະຫວັດສາດຖ້າມີ cityId
    let historicalData = null;
    let weatherStats = null;
    
    if (cityId) {
      try {
        const rawHistoricalData = await getHistoricalWeatherData(cityId, 30);
        historicalData = formatHistoricalDataForLSTM(rawHistoricalData);
        weatherStats = await getWeatherStatistics(cityId, 30);
        
        console.log(`📈 Including ${historicalData ? historicalData.length : 0} historical records for better prediction`);
        if (weatherStats) {
          console.log(`📊 Weather statistics - Avg temp: ${weatherStats.avg_temp?.toFixed(1)}°C, Records: ${weatherStats.record_count}`);
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch historical data, proceeding with location-only prediction');
      }
    }
    
    // ເຕືອມ payload ສໍາລັບ LSTM API
    const payload = {
      lat: lat,
      lon: lon,
      timestamp: new Date().toISOString()
    };
    
    // ເພີ່ມຂໍ້ມູນປະຫວັດສາດຖ້າມີ
    if (historicalData && historicalData.length > 0) {
      payload.historical_data = historicalData;
      payload.use_historical = true;
      
      // ເພີ່ມສະຖິຕິສໍາລັບ context
      if (weatherStats) {
        payload.weather_context = {
          avg_temperature: weatherStats.avg_temp,
          min_temperature: weatherStats.min_temp,
          max_temperature: weatherStats.max_temp,
          avg_humidity: weatherStats.avg_humidity,
          avg_pressure: weatherStats.avg_pressure,
          avg_wind_speed: weatherStats.avg_wind_speed,
          total_rainfall: weatherStats.total_rainfall,
          record_count: weatherStats.record_count
        };
      }
    }
    
    // ເອີ້ນ API
    const response = await axios.post(`${LSTM_API_BASE_URL}/ingest_and_predict`, payload, {
      timeout: 45000, // ເພີ່ມ timeout ເພາະມີຂໍ້ມູນປະຫວັດສາດ
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.predictions) {
      console.log('✅ LSTM API prediction successful');
      return response.data;
    } else {
      throw new Error('Invalid LSTM API response structure');
    }
  } catch (error) {
    console.error('❌ LSTM API call failed:', error.message);
    throw error;
  }
}

// ຟັງຊັນບັນທຶກການທໍານາຍລົງ database
async function savePredictionToDatabase(predictionData, lat, lon, cityId) {
  try {
    const { predictions } = predictionData;
    
    if (!predictions || !Array.isArray(predictions)) {
      throw new Error('Invalid prediction data structure');
    }

    const forecastsToSave = [];
    
    // ເຕີມຂໍ້ມູນການທໍານາຍໃສ່ array ສໍາລັບ batch insert
    for (const prediction of predictions) {
      const predictionTime = new Date(prediction.date);
      const temperature = prediction.predicted_temperature;
      const humidity = prediction.predicted_humidity || null;
      const pressure = prediction.predicted_pressure || null;
      const rainfall = prediction.predicted_rainfall || 0;
      
      // ກວດສອບວ່າມີການທໍານາຍສໍາລັບເວລານີ້ແລ້ວຫຼືບໍ່
      const exists = await persistence.existsForecastForCityAt(
        cityId,
        predictionTime.toISOString().slice(0, 19).replace('T', ' ')
      );

      if (!exists) {
        forecastsToSave.push({
          city_id: cityId,
          timestamp: predictionTime.toISOString().slice(0, 19).replace('T', ' '),
          predicted_temperature: temperature,
          predicted_humidity: humidity,
          predicted_rainfall: rainfall,
          description: `LSTM Prediction - Model v1.0 (${lat}, ${lon})`
        });
      }
    }

    // ບັນທຶກແບບ batch ຖ້າມີຂໍ້ມູນ
    let result = null;
    if (forecastsToSave.length > 0) {
      result = await persistence.createForecastBatch(forecastsToSave);
      console.log(`✅ Saved ${forecastsToSave.length} new LSTM forecasts to database`);
    } else {
      console.log('ℹ️ No new forecasts to save (all already exist)');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error saving LSTM forecasts to database:', error.message);
    throw error;
  }
}

// ຟັງຊັນປະຕິບັດການທໍານາຍອັດຕະໂນມັດສໍາລັບເມືອງໃດໜຶ່ງ
async function runLSTMPredictionForCity(cityConfig) {
  try {
    console.log(`🤖 Running LSTM prediction for ${cityConfig.city}...`);
    
    // ເອີ້ນ LSTM API ພ້ອມກັບ cityId ເພື່ອດຶງຂໍ້ມູນປະຫວັດສາດ
    const predictionData = await callLSTMAPI(cityConfig.lat, cityConfig.lon, cityConfig.cityId);
    
    // ບັນທຶກການທໍານາຍລົງ database
    const savedForecasts = await savePredictionToDatabase(
      predictionData, 
      cityConfig.lat, 
      cityConfig.lon, 
      cityConfig.cityId
    );
    
    const forecastCount = savedForecasts ? savedForecasts.insertedCount || 0 : 0;
    console.log(`✅ LSTM prediction completed for ${cityConfig.city} - ${forecastCount} forecasts saved`);
    return savedForecasts;
  } catch (error) {
    console.error(`❌ LSTM prediction failed for ${cityConfig.city}:`, error.message);
    throw error;
  }
}

// ຟັງຊັນປະຕິບັດການທໍານາຍອັດຕະໂນມັດສໍາລັບທຸກເມືອງ
async function runAutoLSTMPredictions(cityConfigs) {
  console.log('🚀 Starting automatic LSTM predictions for all cities...');
  
  const results = [];
  
  for (const cityConfig of cityConfigs) {
    try {
      const cityResult = await runLSTMPredictionForCity(cityConfig);
      results.push({
        city: cityConfig.city,
        status: 'success',
        forecasts: cityResult ? cityResult.insertedCount || 0 : 0
      });
      
      // ໃຫ້ນອນ 2 ວິນາທີລະຫວ່າງການເອີ້ນແຕ່ລະເມືອງ ເພື່ອບໍ່ໃຫ້ API ຖືກ rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      results.push({
        city: cityConfig.city,
        status: 'error',
        error: error.message
      });
    }
  }
  
  console.log('✅ Automatic LSTM predictions completed for all cities');
  console.log('📊 Results summary:', results);
  
  return results;
}

// ຟັງຊັນລຶບການທໍານາຍເກົ່າ (ເກີນ 7 ມື້)
async function cleanupOldPredictions() {
  try {
    console.log('🧹 Cleaning up old weather forecasts...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Delegate to persistence
    const result = await persistence.deleteOldLSTMPredictions(sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' '));
    console.log(`✅ Cleaned up old LSTM forecasts`);
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up old forecasts:', error.message);
    throw error;
  }
}

// ຟັງຊັນສໍາລັບການຕັ້ງຄ່າ cron jobs
function setupLSTMCronJobs(cityConfigs) {
  console.log('⏰ Setting up LSTM auto-prediction cron jobs...');
  
  // ຕັ້ງຄ່າ cron job ສໍາລັບການທໍານາຍອັດຕະໂນມັດທຸກໆ 1 ຊົ່ວໂມງ
  cron.schedule('0 * * * *', async () => {
    console.log('[LSTM-CRON] Running auto predictions every hour...');
    try {
      await runAutoLSTMPredictions(cityConfigs);
    } catch (error) {
      console.error('[LSTM-CRON] Error in auto predictions:', error.message);
    }
  });
  
  // ຕັ້ງຄ່າ cron job ສໍາລັບການລຶບຂໍ້ມູນເກົ່າທຸກໆ ມື້ເວລາ 02:00
  cron.schedule('0 2 * * *', async () => {
    console.log('[LSTM-CRON] Running daily cleanup at 2:00 AM...');
    try {
      await cleanupOldPredictions();
    } catch (error) {
      console.error('[LSTM-CRON] Error in daily cleanup:', error.message);
    }
  });
  
  console.log('✅ LSTM cron jobs setup completed');
  console.log('📅 Schedule: Auto predictions every hour, cleanup daily at 2:00 AM');
}

// ຟັງຊັນເລີ່ມຕົ້ນລະບົບ LSTM ອັດຕະໂນມັດ
function initializeLSTMSystem(cityConfigs) {
  console.log('🚀 Initializing LSTM Auto-Prediction System...');
  
  // ຕັ້ງຄ່າ cron jobs
  setupLSTMCronJobs(cityConfigs);
  
  // ເຮີດການທໍານາຍເລີ່ມຕົ້ນ (ທາງເລືອກ)
  setTimeout(async () => {
    console.log('🔄 Running initial LSTM predictions...');
    try {
      await runAutoLSTMPredictions(cityConfigs);
    } catch (error) {
      console.error('❌ Initial LSTM predictions failed:', error.message);
    }
  }, 5000); // ລໍຖ້າ 5 ວິນາທີຫຼັງຈາກເຊີບເວີເລີ່ມຕົ້ນ
  
  console.log('✅ LSTM Auto-Prediction System initialized');
}

// API endpoints
async function getLSTMPredictions(req, res) {
  try {
    const { cityId, days = 7 } = req.query;
    
    const forecasts = await persistence.getLSTMPredictions({ cityId: cityId || null, days: parseInt(days), limit: 100 });
    res.json({ success: true, forecasts: forecasts, count: forecasts.length });
  } catch (error) {
    console.error('Error fetching LSTM forecasts:', error);
    res.status(500).json({ error: 'Failed to fetch LSTM forecasts' });
  }
}

async function triggerManualPrediction(req, res) {
  try {
    const { cityId, lat, lon } = req.body;
    
    if (!cityId || !lat || !lon) {
      return res.status(400).json({ error: 'cityId, lat, and lon are required' });
    }
    
    const cityConfig = { cityId, lat, lon, city: `Manual-${cityId}` };
    const result = await runLSTMPredictionForCity(cityConfig);
    
    res.json({
      success: true,
      message: 'Manual LSTM prediction completed with historical data',
      forecasts: result ? result.insertedCount || 0 : 0
    });
  } catch (error) {
    console.error('Error in manual prediction:', error);
    res.status(500).json({ error: 'Manual prediction failed' });
  }
}

// API endpoint ສໍາລັບດຶງຂໍ້ມູນປະຫວັດສາດ
async function getHistoricalDataAPI(req, res) {
  try {
    const { cityId, days = 30 } = req.query;
    
    if (!cityId) {
      return res.status(400).json({ error: 'cityId is required' });
    }
    
    const historicalData = await getHistoricalWeatherData(cityId, days);
    const weatherStats = await getWeatherStatistics(cityId, days);
    
    res.json({
      success: true,
      cityId: cityId,
      days: days,
      historicalData: historicalData,
      statistics: weatherStats,
      count: historicalData.length
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
}

module.exports = {
  initializeLSTMSystem,
  runAutoLSTMPredictions,
  runLSTMPredictionForCity,
  getLSTMPredictions,
  triggerManualPrediction,
  cleanupOldPredictions,
  getHistoricalDataAPI,
  getHistoricalWeatherData,
  getWeatherStatistics
};
