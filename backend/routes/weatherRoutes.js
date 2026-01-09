const express = require('express');
const axios = require('axios');
const weatherPersistence = require('../services/weatherPersistence');

const router = express.Router();
const {
  getAllWeather,
  getWeatherData,
  getLatestWeather,
  getWeatherByLocation,
  fetchAndSaveWeather,
  get7DayTimeline,
  getForecast7Days,
  predictWeatherByCityId,
  predictWeatherByLatLon,
  getPredictions,
  getMockPredictions,
  getCurrentWeatherForAlerts,
  getRainfallComparison,
} = require('../controllers/weatherController');

const { validateWeatherQuery, validatePagination } = require('../middleware/inputValidation');

const Weather = require('../models/weatherModel');
const City = require('../models/cityModel');
const WeatherForecast = require('../models/weatherForecastModel');
const Province = require('../models/provinceModel');

// Core CRUD & Current
router.get('/', validatePagination, getAllWeather);
router.get('/data', validateWeatherQuery, getWeatherData);
router.get('/latest', getLatestWeather);
router.get('/current', validateWeatherQuery, getWeatherByLocation);
router.get('/current-alerts', getCurrentWeatherForAlerts); // New route for alerts
router.get('/fetch-save', fetchAndSaveWeather);

// LSTM Predictions endpoint
router.get('/predictions', async (req, res) => {
  try {
    console.log('🔄 [API] /predictions endpoint called at', new Date().toISOString());
    console.log('🔄 [API] Client IP:', req.ip);

    // support pagination: ?limit=100&offset=0
    const limit = req.query.limit || 100;
    const offset = req.query.offset || 0;

    // Fetch forecasts with pagination from persistence
    const forecasts = await weatherPersistence.getForecasts({ limit, offset });

    console.log('📊 [API] Raw forecasts from DB:', forecasts.length, 'records (paginated)');

    // Get actual weather data for comparison (limited)
    const actualWeatherData = await weatherPersistence.getRecentActualWeather(200);

    const formattedForecasts = forecasts.map((forecast) => {
      // Convert timestamp to string format if it's a Date object
      const forecastTimestamp = forecast.timestamp instanceof Date
        ? forecast.timestamp.toISOString()
        : forecast.timestamp;
      const forecastDate = forecastTimestamp ? forecastTimestamp.split('T')[0] : null;

      // Find matching actual weather data
      const matchingWeather = actualWeatherData.find((weather) => {
        const weatherTimestamp = weather.timestamp instanceof Date
          ? weather.timestamp.toISOString()
          : weather.timestamp;
        const weatherDate = weatherTimestamp ? weatherTimestamp.split('T')[0] : null;
        return weather.city_id === forecast.city_id && weatherDate === forecastDate;
      });

      return {
        id: forecast.id,
        prediction_date: forecast.timestamp,
        predicted_temperature: forecast.predicted_temperature,
        predicted_humidity: forecast.predicted_humidity,
        predicted_rainfall: forecast.predicted_rainfall,
        actual_temperature: matchingWeather?.temperature || null,
        actual_humidity: matchingWeather?.humidity || null,
        actual_pressure: matchingWeather?.pressure || null,
        actual_rainfall: matchingWeather?.rainfall || null,
        actual_wind_speed: matchingWeather?.wind_speed || null,
        confidence: 85 + Math.random() * 10, // Random confidence between 85-95%
        city_id: forecast.city_id,
        cityName: forecast.city_name_th || forecast.city_name_en || 'Unknown City',
        created_at: forecast.created_at,
        forecastCity: {
          id: forecast.city_id,
          name_th: forecast.city_name_th,
          name_en: forecast.city_name_en,
          lat: forecast.lat,
          lon: forecast.lon,
        },
      };
    });

    console.log('✅ [API] Formatted forecasts ready:', formattedForecasts.length, 'records');
    if (formattedForecasts.length > 0) {
      console.log('📄 [API] Sample formatted forecast:', formattedForecasts[0]);
    }

    console.log(`📊 Found ${forecasts.length} weather forecasts from database (paginated)`);
    res.json(formattedForecasts);
  } catch (error) {
    console.error('❌ [API] Error fetching predictions:', error.message);
    console.error('❌ [API] Full error:', error);
    res.status(500).json({
      error: 'Failed to fetch predictions',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Public cities endpoint (no authentication required)
router.get('/cities', async (req, res) => {
  try {
    const cities = await City.findAll({
      attributes: ['id', 'name_th', 'name_en', 'lat', 'lon', 'province_id', 'region'],
      include: [{
        model: Province,
        as: 'province',
        attributes: ['name_th', 'name_en'],
      }],
      order: [['name_th', 'ASC']],
    });

    // Format for frontend compatibility
    const formattedCities = cities.map((city) => ({
      id: city.id,
      name: city.name_th || city.name_en,
      name_th: city.name_th,
      name_en: city.name_en,
      latitude: city.lat,
      longitude: city.lon,
      province_id: city.province_id,
      region: city.region,
      status: 'Active', // Default status
      provinceName: city.province ? (city.province.name_th || city.province.name_en) : 'Unknown',
    }));

    res.json(formattedCities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// NEW ENDPOINT: Fresh predictions (bypass browser cache)
router.get('/predictions-fresh', async (req, res) => {
  try {
    console.log('🚀 [BACKEND] /api/weather/predictions-fresh called by client:', req.ip, 'at', new Date().toISOString());
    console.log('📊 [BACKEND] Query parameters:', req.query);

    // Add anti-cache headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Content-Type-Options': 'nosniff',
    });

    // Fetch fresh predictions with a reasonable default limit
    const limit = req.query.limit || 500;
    const forecasts = await weatherPersistence.getForecasts({ limit, offset: 0 });

    console.log('✅ [API] Fresh predictions loaded:', forecasts.length, 'total records from weatherforecast table');
    console.log('📄 [API] Sample forecast:', forecasts[0]);

    // Format response with proper field mapping
    const formattedForecasts = forecasts.map((forecast) => ({
      id: forecast.id,
      prediction_date: forecast.prediction_date,
      predicted_temperature: forecast.predicted_temperature,
      actual_temperature: forecast.actual_temperature,
      predicted_humidity: forecast.predicted_humidity,
      actual_humidity: forecast.actual_humidity,
      predicted_rainfall: forecast.predicted_rainfall,
      actual_rainfall: forecast.actual_rainfall,
      confidence: forecast.confidence,
      city_id: forecast.city_id,
      cityName: forecast.city_name_th || forecast.city_name_en || 'Unknown City',
      created_at: forecast.created_at,
      updated_at: forecast.updated_at,
      timestamp: forecast.timestamp,
    }));

    console.log('🎯 [API] Returning fresh predictions:', formattedForecasts.length, 'records');
    res.json(formattedForecasts);
  } catch (error) {
    console.error('❌ [API] Error in /predictions-fresh:', error);
    res.status(500).json({
      error: 'Failed to fetch fresh predictions',
      details: error.message,
    });
  }
});

// Dashboard endpoints
router.get('/provinces-summary', async (req, res) => {
  try {
    console.log('🔍 Fetching province weather summary...');

    // Try to get real data first
    try {
      // Simple approach - get all provinces first
      const provinces = await Province.findAll({
        include: [{
          model: City,
          as: 'cities',
          include: [{
            model: Weather,
            as: 'weather',
            limit: 1,
            order: [['timestamp', 'DESC']],
          }],
        }],
      });

      const provinceWeatherData = provinces.map((province) => {
        const cityWeathers = province.cities
          .map((city) => city.weather).flat().filter((w) => w);
        const temperatures = cityWeathers
          .map((w) => w.temperature).filter((t) => t != null);
        const humidities = cityWeathers
          .map((w) => w.humidity).filter((h) => h != null);
        const rainfalls = cityWeathers.map((w) => w.rainfall).filter((r) => r != null);

        return {
          province_name: province.name_th || province.name_en || 'Unknown',
          avg_temperature: temperatures.length > 0
            ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length
            : 28,
          avg_humidity: humidities.length > 0
            ? humidities.reduce((a, b) => a + b, 0) / humidities.length
            : 70,
          avg_rainfall: rainfalls.length > 0
            ? rainfalls.reduce((a, b) => a + b, 0) / rainfalls.length
            : 120,
          data_points: cityWeathers.length,
        };
      });

      console.log('✅ Got province weather data:', provinceWeatherData.length, 'provinces');
      if (provinceWeatherData.length > 0) {
        return res.json(provinceWeatherData);
      }
    } catch (dbError) {
      console.warn('⚠️ Database query failed:', dbError.message);
    }

    // Fallback to mock data
    console.log('📊 Using mock province weather data');
    const mockData = [
      {
        province_name: 'ວຽງຈັນ', avg_temperature: 28.5, avg_humidity: 75, avg_rainfall: 120, data_points: 10,
      },
      {
        province_name: 'ລວງພະບາງ', avg_temperature: 26.2, avg_humidity: 78, avg_rainfall: 150, data_points: 8,
      },
      {
        province_name: 'ປາກເຊ', avg_temperature: 32.1, avg_humidity: 70, avg_rainfall: 80, data_points: 12,
      },
      {
        province_name: 'ສະຫວັນນະເຂດ', avg_temperature: 29.8, avg_humidity: 73, avg_rainfall: 100, data_points: 9,
      },
      {
        province_name: 'ຈໍາປາສັກ', avg_temperature: 31.4, avg_humidity: 68, avg_rainfall: 90, data_points: 11,
      },
      {
        province_name: 'ຫົວພັນ', avg_temperature: 24.5, avg_humidity: 82, avg_rainfall: 200, data_points: 7,
      },
      {
        province_name: 'ອຸດົມໄຊ', avg_temperature: 25.3, avg_humidity: 80, avg_rainfall: 180, data_points: 6,
      },
      {
        province_name: 'ບໍ່ແກ້ວ', avg_temperature: 27.1, avg_humidity: 76, avg_rainfall: 160, data_points: 8,
      },
      {
        province_name: 'ຜົ້ງສາລີ', avg_temperature: 23.8, avg_humidity: 85, avg_rainfall: 220, data_points: 5,
      },
      {
        province_name: 'ຊຽງຂວາງ', avg_temperature: 22.5, avg_humidity: 88, avg_rainfall: 250, data_points: 4,
      },
      {
        province_name: 'ບໍລິຄໍາໄຊ', avg_temperature: 26.8, avg_humidity: 77, avg_rainfall: 140, data_points: 9,
      },
      {
        province_name: 'ຄໍາມ່ວນ', avg_temperature: 30.2, avg_humidity: 71, avg_rainfall: 70, data_points: 11,
      },
      {
        province_name: 'ສາລະວັນ', avg_temperature: 29.5, avg_humidity: 74, avg_rainfall: 110, data_points: 10,
      },
      {
        province_name: 'ເຊກອງ', avg_temperature: 31.8, avg_humidity: 69, avg_rainfall: 85, data_points: 12,
      },
      {
        province_name: 'ອັດຕະປື', avg_temperature: 33.2, avg_humidity: 65, avg_rainfall: 60, data_points: 13,
      },
      {
        province_name: 'ຫຼວງນໍ້າທາ', avg_temperature: 25.7, avg_humidity: 81, avg_rainfall: 190, data_points: 6,
      },
      {
        province_name: 'ຂໍ້ງເຊດໂດນ', avg_temperature: 29.3, avg_humidity: 72, avg_rainfall: 130, data_points: 8,
      },
    ];
    res.json(mockData);
  } catch (error) {
    console.error('❌ Error fetching province weather summary:', error);
    res.status(500).json({ error: 'Failed to fetch province weather summary' });
  }
});

// Weather Data CRUD Operations
router.post('/', async (req, res) => {
  try {
    const {
      cityId, date, temperature, humidity, pressure, windSpeed, rainfall, weatherCondition,
    } = req.body;

    if (!cityId || !date || !temperature || !humidity) {
      return res.status(400).json({
        error: 'City, date, temperature, and humidity are required',
      });
    }

    const weatherData = await Weather.create({
      city_id: cityId,
      date: new Date(date),
      temperature,
      humidity,
      pressure,
      windSpeed,
      rainfall,
      weatherCondition,
      timestamp: new Date(),
    });

    const weatherWithCity = await Weather.findByPk(weatherData.id, {
      include: [{
        model: City,
        as: 'weatherCity',
        attributes: ['id', 'name_th', 'name_en'],
      }],
    });

    res.status(201).json(weatherWithCity);
  } catch (error) {
    console.error('Error creating weather data:', error);
    res.status(500).json({ error: 'Failed to create weather data' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cityId, date, temperature, humidity, pressure, windSpeed, rainfall, weatherCondition,
    } = req.body;

    const weather = await Weather.findByPk(id);
    if (!weather) {
      return res.status(404).json({ error: 'Weather record not found' });
    }

    await weather.update({
      city_id: cityId,
      date: new Date(date),
      temperature,
      humidity,
      pressure,
      windSpeed,
      rainfall,
      weatherCondition,
    });

    const updatedWeather = await Weather.findByPk(id, {
      include: [{
        model: City,
        as: 'weatherCity',
        attributes: ['id', 'name_th', 'name_en'],
      }],
    });

    res.json(updatedWeather);
  } catch (error) {
    console.error('Error updating weather data:', error);
    res.status(500).json({ error: 'Failed to update weather data' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const weather = await Weather.findByPk(id);
    if (!weather) {
      return res.status(404).json({ error: 'Weather record not found' });
    }

    await weather.destroy();
    res.json({ message: 'Weather record deleted successfully' });
  } catch (error) {
    console.error('Error deleting weather data:', error);
    res.status(500).json({ error: 'Failed to delete weather data' });
  }
});

// Test endpoints for city weather API
router.get('/test/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;

    // Get city data using Sequelize
    const city = await City.findByPk(cityId);
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    // Check if city has coordinates
    if (!city.lat || !city.lon) {
      return res.status(400).json({
        success: false,
        error: 'City coordinates not found. Please add latitude and longitude.',
      });
    }

    // Test OpenWeatherMap API
    const { OPENWEATHER_API_KEY } = process.env;
    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ success: false, error: 'OpenWeatherMap API key not configured' });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
    );

    if (response.data) {
      res.json({
        success: true,
        data: {
          temperature: response.data.main.temp,
          humidity: response.data.main.humidity,
          pressure: response.data.main.pressure,
          weather: response.data.weather[0].description,
          city: city.name_th || city.name_en,
          coordinates: { lat: city.lat, lon: city.lon },
        },
      });
    } else {
      res.status(500).json({ success: false, error: 'No weather data received' });
    }
  } catch (error) {
    console.error('Weather API test error:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// ML Prediction
router.post('/predict', predictWeatherByCityId);
router.post('/predict-by-location', predictWeatherByLatLon);

// LSTM Predictions from WeatherForecast table
router.get('/predictions', getPredictions);
router.get('/predictions/mock', getMockPredictions);

// Tomorrow.io 7-day forecast
router.get('/tomorrow', get7DayTimeline);

// Unified GET /forecast for frontend compatibility
router.get('/forecast', get7DayTimeline);

// Fallback mocks (7-day forecast dummy)
router.get('/forecast7', getForecast7Days);
router.get('/forecast7days', getForecast7Days);

// Generate sample WeatherForecast data for testing
router.post('/generate-sample-predictions', async (req, res) => {
  try {
    const cities = await City.findAll({
      attributes: ['id', 'name_th', 'name_en'],
      limit: 5,
    });

    if (cities.length === 0) {
      return res.status(400).json({ error: 'No cities found' });
    }

    const sampleForecasts = [];

    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return { date, index: i };
    });

    dates.forEach(({ date, index }) => {
      cities.forEach((city) => {
        sampleForecasts.push({
          city_id: city.id,
          timestamp: date.toISOString().split('T')[0],
          predicted_temperature: 25 + Math.random() * 10,
          predicted_humidity: 60 + Math.random() * 30,
          predicted_rainfall: Math.random() * 50,
          temperature: index < 7 ? 25 + Math.random() * 10 : null, // Actual values for past 7 days
          humidity: index < 7 ? 60 + Math.random() * 30 : null,
          description: 'LSTM Prediction',
        });
      });
    });

    await WeatherForecast.createBatch(sampleForecasts);

    res.json({
      success: true,
      message: `Generated ${sampleForecasts.length} sample predictions`,
      count: sampleForecasts.length,
    });
  } catch (error) {
    console.error('Error generating sample predictions:', error);
    res.status(500).json({ error: 'Failed to generate sample predictions' });
  }
});

// Rainfall comparison endpoint
router.get('/rainfall-comparison', getRainfallComparison);

module.exports = router;
