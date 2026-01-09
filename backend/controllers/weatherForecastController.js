const axios = require('axios');
const WeatherForecast = require('../models/weatherForecastModel');
const City = require('../models/cityModel');

class WeatherForecastController {
  // Get all weather forecasts
  static async getAllForecasts(req, res) {
    try {
      const filters = {
        city_id: req.query.city_id,
        forecast_type: req.query.forecast_type || 'lstm',
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        limit: req.query.limit,
      };

      const forecasts = await WeatherForecast.findAll(filters);

      res.json({
        success: true,
        data: forecasts,
        count: forecasts.length,
      });
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weather forecasts',
      });
    }
  }

  // Get forecast by ID
  static async getForecastById(req, res) {
    try {
      const { id } = req.params;
      const forecast = await WeatherForecast.findById(id);

      if (!forecast) {
        return res.status(404).json({
          success: false,
          error: 'Weather forecast not found',
        });
      }

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      console.error('Error fetching forecast by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weather forecast',
      });
    }
  }

  // Generate LSTM predictions for a city
  static async generateLSTMPredictions(req, res) {
    try {
      const { cityId } = req.params;
      const { days = 7 } = req.body;

      console.log(`Generating LSTM predictions for city ${cityId} for ${days} days`);

      // Get city coordinates first
      const city = await City.findByPk(cityId);
      if (!city) {
        return res.status(404).json({
          success: false,
          error: 'City not found',
        });
      }

      // Call LSTM API server using configured ML_SERVICE_URL
      const ML_BASE = process.env.ML_SERVICE_URL || process.env.PYTHON_API_URL || 'http://127.0.0.1:5001';
      const lstmResponse = await axios.post(`${ML_BASE}/ingest_and_predict?lat=${city.lat}&lon=${city.lon}`, {}, {
        timeout: 30000, // 30 seconds timeout
      });

      if (lstmResponse.status !== 200 || lstmResponse.data.status !== 'success') {
        throw new Error('LSTM prediction failed');
      }

      const predictionData = lstmResponse.data.predictions;

      // Process predictions from LSTM API response
      const predictions = [];
      for (let i = 0; i < predictionData.times.length && i < days; i++) {
        predictions.push({
          date: predictionData.times[i],
          temperature: predictionData.temperatures[i],
          humidity: predictionData.humidities[i],
          rainfall: predictionData.rainfalls[i],
          pressure: predictionData.pressures[i],
          wind_speed: predictionData.wind_speeds[i],
          condition: null,
          confidence: 0.85 + Math.random() * 0.1,
          model_version: 'v1.0',
        });
      }

      // Prepare forecast data for database
      const forecastsData = predictions.map((pred) => ({
        city_id: parseInt(cityId),
        timestamp: pred.date,
        predicted_temperature: pred.temperature,
        predicted_humidity: pred.humidity,
        predicted_rainfall: pred.rainfall || 0,
        description: pred.condition || null,
      }));

      // Save predictions to database
      const result = await WeatherForecast.createBatch(forecastsData);

      res.json({
        success: true,
        message: `Generated ${result.insertedCount} LSTM predictions for city ${cityId}`,
        data: {
          city_id: cityId,
          predictions_count: result.insertedCount,
          predictions: forecastsData,
        },
      });
    } catch (error) {
      console.error('Error generating LSTM predictions:', error);

      let errorMessage = 'Failed to generate LSTM predictions';
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'LSTM model server is not available. Please ensure the ML server is running.';
      } else if (error.response) {
        errorMessage = error.response.data?.error || errorMessage;
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
        details: error.message,
      });
    }
  }

  // Batch generate predictions for all active cities
  static async generateBatchPredictions(req, res) {
    try {
      const { days = 7 } = req.body;

      // Get all active cities using Sequelize
      const cities = await City.findAll({
        where: {},
        attributes: ['id', 'name_th', 'name_en', 'lat', 'lon'],
      });

      const results = [];
      const errors = [];

      for (const city of cities) {
        try {
          // Call LSTM API for each city using configured ML_SERVICE_URL
          const ML_BASE = process.env.ML_SERVICE_URL || process.env.PYTHON_API_URL || 'http://127.0.0.1:5001';
          const lstmResponse = await axios.post(`${ML_BASE}/ingest_and_predict?lat=${city.lat}&lon=${city.lon}`, {}, {
            timeout: 30000,
          });

          if (lstmResponse.status === 200 && lstmResponse.data.status === 'success') {
            const predictionData = lstmResponse.data.predictions;

            // Process predictions from LSTM API response
            const predictions = [];
            for (let i = 0; i < predictionData.times.length && i < days; i++) {
              predictions.push({
                date: predictionData.times[i],
                temperature: predictionData.temperatures[i],
                humidity: predictionData.humidities[i],
                rainfall: predictionData.rainfalls[i],
                pressure: predictionData.pressures[i],
                wind_speed: predictionData.wind_speeds[i],
                condition: null,
                confidence: 0.85 + Math.random() * 0.1,
                model_version: 'v1.0',
              });
            }

            const forecastsData = predictions.map((pred) => ({
              city_id: city.id,
              timestamp: pred.date,
              predicted_temperature: pred.temperature,
              predicted_humidity: pred.humidity,
              predicted_rainfall: pred.rainfall || 0,
              description: pred.condition || null,
            }));

            const result = await WeatherForecast.createBatch(forecastsData);
            results.push({
              city_id: city.id,
              city_name: city.name_th || city.name_en,
              predictions_count: result.insertedCount,
              status: 'success',
            });
          }
        } catch (error) {
          errors.push({
            city_id: city.id,
            city_name: city.name_th || city.name_en,
            error: error.message,
            status: 'failed',
          });
        }
      }

      res.json({
        success: true,
        message: `Batch prediction completed. ${results.length} cities successful, ${errors.length} failed.`,
        data: {
          successful: results,
          failed: errors,
          total_cities: cities.length,
        },
      });
    } catch (error) {
      console.error('Error in batch predictions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate batch predictions',
      });
    }
  }

  // Update forecast with actual values for accuracy measurement
  static async updateActualValues(req, res) {
    try {
      const { id } = req.params;
      const { actual_temperature, actual_humidity, actual_rainfall } = req.body;

      const updated = await WeatherForecast.updateActualValues(id, {
        actual_temperature,
        actual_humidity,
        actual_rainfall,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Weather forecast not found',
        });
      }

      res.json({
        success: true,
        message: 'Actual values updated successfully',
      });
    } catch (error) {
      console.error('Error updating actual values:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update actual values',
      });
    }
  }

  // Get forecast accuracy statistics
  static async getAccuracyStats(req, res) {
    try {
      const { city_id, date_from, date_to } = req.query;

      const stats = await WeatherForecast.getAccuracyStats(city_id, date_from, date_to);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting accuracy stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get accuracy statistics',
      });
    }
  }

  // Get latest forecasts for all cities
  static async getLatestForecasts(req, res) {
    try {
      const forecasts = await WeatherForecast.getLatestForecasts();

      res.json({
        success: true,
        data: forecasts,
        count: forecasts.length,
      });
    } catch (error) {
      console.error('Error fetching latest forecasts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch latest forecasts',
      });
    }
  }

  // Delete forecast
  static async deleteForecast(req, res) {
    try {
      const { id } = req.params;

      const deleted = await WeatherForecast.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Weather forecast not found',
        });
      }

      res.json({
        success: true,
        message: 'Weather forecast deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting forecast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete weather forecast',
      });
    }
  }

  // Create manual forecast (for testing or manual input)
  static async createForecast(req, res) {
    try {
      const forecastData = req.body;

      const forecast = await WeatherForecast.create(forecastData);

      res.status(201).json({
        success: true,
        message: 'Weather forecast created successfully',
        data: forecast,
      });
    } catch (error) {
      console.error('Error creating forecast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create weather forecast',
      });
    }
  }
}

module.exports = WeatherForecastController;
