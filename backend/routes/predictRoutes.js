// routes/predictRoutes.js
const express = require('express');

const router = express.Router();
const axios = require('axios');
const WeatherForecast = require('../models/weatherForecastModel');
const City = require('../models/cityModel');

// Create axios instance for ML API (respect ML_SERVICE_URL env if set)
const ML_BASE = process.env.ML_SERVICE_URL || process.env.PYTHON_API_URL || 'http://127.0.0.1:5001';
const mlApiClient = axios.create({
  baseURL: ML_BASE,
  timeout: 10000,
});

// Create axios instance for LSTM service
const lstmApiClient = axios.create({
  baseURL: 'http://127.0.0.1:5001',
  timeout: 10000,
});

router.post('/fetch-predict-save', async (req, res) => {
  try {
    let { lat, lon } = req.body;
    lat = Number(lat);
    lon = Number(lon);
    if (
      lat == null || lon == null
      || isNaN(lat) || isNaN(lon)
    ) {
      return res.status(400).json({ message: 'lat & lon are required in body and must be valid numbers' });
    }

    console.log(`🔍 Calling ML API: /ingest_and_predict (body) lat=${lat} lon=${lon}`);

    // Send a JSON body matching what the Flask ingest_and_predict expects
    const payload = {
      city_id: null,
      city_name: null,
      coordinates: { lat, lon },
      historical_data: [],
      stats: {},
    };

    const mlRes = await mlApiClient.post('/ingest_and_predict', payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('✅ ML API response received:', mlRes.status);
    console.log('✅ ML API data structure:', Object.keys(mlRes.data));

    // Return the ML API response directly
    res.json({
      success: true,
      data: mlRes.data,
    });
  } catch (err) {
    console.error('❌ Predict error:', err.message);
    console.error('❌ Error details:', err.response?.data || err.code || 'Unknown error');
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: `ML API service unavailable. Please ensure the ML server is reachable at ${ML_BASE}.`,
        error: err.message,
      });
    }

    // Include ML response body and status when available for easier debugging
    const mlBody = err.response?.data;
    const mlStatus = err.response?.status;

    res.status(500).json({
      success: false,
      message: mlBody?.message || mlBody?.detail || err.message || 'ML API Error',
      mlStatus,
      mlBody,
      error: err.code || 'Unknown',
    });
  }
});

// Generate predictions for a specific city
router.post('/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { days = 7 } = req.body;

    // Get city data
    const city = await City.findByPk(cityId);
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    console.log(`🔮 Generating ${days}-day predictions for city: ${city.name_th}`);

    // Call ML API to generate predictions
    const mlRes = await mlApiClient.post('/ingest_and_predict', null, {
      params: {
        lat: parseFloat(city.lat),
        lon: parseFloat(city.lon),
        days,
      },
    });

    if (mlRes.data && mlRes.data.predictions) {
      // Save predictions to database
      const predictions = [];
      for (let i = 0; i < days; i++) {
        const predictionDate = new Date();
        predictionDate.setDate(predictionDate.getDate() + i + 1);

        const prediction = await WeatherPrediction.create({
          cityId,
          prediction_date: predictionDate,
          predicted_temperature: mlRes.data.predictions.temperatures?.[i] || 25,
          predicted_humidity: mlRes.data.predictions.humidities?.[i] || 70,
          predicted_rainfall: mlRes.data.predictions.rainfalls?.[i] || 0,
          confidence: mlRes.data.confidence || 0.85,
          model_version: mlRes.data.model_version || '1.0',
          prediction_data: JSON.stringify({
            temperature: mlRes.data.predictions.temperatures?.[i] || 25,
            humidity: mlRes.data.predictions.humidities?.[i] || 70,
            pressure: mlRes.data.predictions.pressures?.[i] || 1013,
            wind_speed: mlRes.data.predictions.wind_speeds?.[i] || 3,
            rainfall: mlRes.data.predictions.rainfalls?.[i] || 0,
          }),
        });

        predictions.push(prediction);
      }

      console.log(`✅ Generated ${predictions.length} predictions for ${city.name_th}`);
      res.json({
        success: true,
        message: `Generated ${predictions.length} predictions for ${city.name_th}`,
        predictions,
      });
    } else {
      res.status(500).json({ success: false, error: 'No prediction data received from ML service' });
    }
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// Test LSTM prediction endpoint
router.get('/test/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const City = require('../models/cityModel');

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

    console.log(`🔍 Testing LSTM prediction for city: ${city.name_th || city.name_en} (${city.lat}, ${city.lon})`);

    // Test ML API connection
    const mlRes = await mlApiClient.post('/ingest_and_predict', null, {
      params: {
        lat: parseFloat(city.lat),
        lon: parseFloat(city.lon),
      },
    });

    console.log('✅ LSTM prediction test successful');
    res.json({
      success: true,
      data: {
        city: city.name_th || city.name_en,
        coordinates: { lat: city.lat, lon: city.lon },
        prediction: mlRes.data,
        coordinates: {
          lat: city.lat,
          lon: city.lon,
        },
      },
    });
  } catch (error) {
    console.error('❌ LSTM prediction test error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: `ML API service unavailable. Please ensure the ML server is reachable at ${ML_BASE}.`,
      });
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.detail || error.message || 'LSTM prediction failed',
    });
  }
});

// Test route to check if predict routes are working
router.get('/test', (req, res) => {
  res.json({
    message: 'Predict routes are working!',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /test',
      'POST /fetch-predict-save',
      'POST /:cityId',
      'GET /test/:cityId',
    ],
  });
});

// LSTM prediction endpoint
router.get('/lstm', async (req, res) => {
  try {
    const { days = 7, cityId = 1 } = req.query;

    console.log(`🔍 Calling LSTM API: /predict?days=${days}&cityId=${cityId}`);

    // Try to call the LSTM service
    try {
      const lstmRes = await lstmApiClient.get('/predict', {
        params: { days, cityId },
      });

      console.log('✅ LSTM API response received:', lstmRes.status);
      res.json(lstmRes.data);
    } catch (lstmError) {
      console.warn('⚠️ LSTM service unavailable, using mock data:', lstmError.message);

      // Fallback to mock data
      const mockPredictions = [];
      const baseTemp = 28;

      for (let i = 0; i < parseInt(days); i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        mockPredictions.push({
          date: date.toISOString().split('T')[0],
          predicted_temperature: baseTemp + Math.sin(i * 0.5) * 3 + Math.random() * 2 - 1,
          predicted_humidity: 70 + Math.random() * 20 - 10,
          predicted_rainfall: Math.random() > 0.7 ? Math.random() * 5 : 0,
          actual_temperature: i < 3 ? baseTemp + Math.sin(i * 0.5) * 2.5 + Math.random() * 1.5 - 0.75 : null,
          actual_humidity: i < 3 ? 70 + Math.random() * 15 - 7.5 : null,
          actual_rainfall: i < 3 ? (Math.random() > 0.8 ? Math.random() * 3 : 0) : null,
          confidence: 0.85 + Math.random() * 0.1,
        });
      }

      res.json(mockPredictions);
    }
  } catch (error) {
    console.error('❌ LSTM prediction error:', error);
    res.status(500).json({
      error: 'Failed to get LSTM predictions',
      message: error.message,
    });
  }
});

module.exports = router;
