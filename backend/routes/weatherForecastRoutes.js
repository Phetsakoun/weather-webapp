const express = require('express');
const WeatherForecastController = require('../controllers/weatherForecastController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all weather forecasts with optional filters
router.get('/', WeatherForecastController.getAllForecasts);

// Get latest forecasts for all cities
router.get('/latest', WeatherForecastController.getLatestForecasts);

// Get forecast accuracy statistics
router.get('/accuracy', WeatherForecastController.getAccuracyStats);

// Get specific forecast by ID
router.get('/:id', WeatherForecastController.getForecastById);

// Generate LSTM predictions for a specific city
router.post('/generate/:cityId', WeatherForecastController.generateLSTMPredictions);

// Generate batch LSTM predictions for all active cities
router.post('/generate-batch', WeatherForecastController.generateBatchPredictions);

// Create manual forecast
router.post('/', WeatherForecastController.createForecast);

// Update actual values for accuracy measurement
router.put('/:id/actual', WeatherForecastController.updateActualValues);

// Delete forecast
router.delete('/:id', WeatherForecastController.deleteForecast);

module.exports = router;
