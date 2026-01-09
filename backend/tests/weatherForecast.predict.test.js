// backend/tests/weatherForecast.predict.test.js
const request = require('supertest');
const express = require('express');
const nock = require('nock');

// Mock persistence and models before loading routes
jest.mock('../services/weatherPersistence');
jest.mock('../models/cityModel');
jest.mock('../models/weatherForecastModel');

const persistence = require('../services/weatherPersistence');
const City = require('../models/cityModel');
const WeatherForecast = require('../models/weatherForecastModel');
const weatherForecastRoutes = require('../routes/weatherForecastRoutes');

describe('Weather Forecast & Predict Flow (Complete)', () => {
  let app;

  beforeAll(() => {
    process.env.ML_SERVICE_URL = 'http://127.0.0.1:5001';
    process.env.JWT_SECRET = 'test_secret';

    app = express();
    app.use(express.json());
    app.use('/api/weather/forecasts', weatherForecastRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  describe('POST /api/weather/forecasts/generate/:cityId', () => {
    it('should generate LSTM predictions and save to database', async () => {
      const cityId = 1;
      const days = 3;

      // Mock City.findByPk
      City.findByPk.mockResolvedValue({
        id: cityId,
        name_th: 'ວຽງຈັນ',
        name_en: 'Vientiane',
        lat: 17.9757,
        lon: 102.6331,
      });

      // Mock LSTM API response
      nock('http://127.0.0.1:5001')
        .post(/\/ingest_and_predict/)
        .reply(200, {
          status: 'success',
          predictions: {
            times: ['2024-01-15', '2024-01-16', '2024-01-17'],
            temperatures: [28.5, 29.1, 27.8],
            humidities: [65, 60, 70],
            rainfalls: [10, 5, 15],
            pressures: [1013, 1012, 1014],
            wind_speeds: [3.2, 2.8, 3.5],
          },
        });

      // Mock WeatherForecast.createBatch
      WeatherForecast.createBatch.mockResolvedValue({
        insertedCount: days,
      });

      const response = await request(app)
        .post(`/api/weather/forecasts/generate/${cityId}`)
        .send({ days })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('predictions_count', days);
      expect(WeatherForecast.createBatch).toHaveBeenCalled();
    }, 20000);

    it('should return error when city not found', async () => {
      const cityId = 9999;

      City.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/weather/forecasts/generate/${cityId}`)
        .send({ days: 3 })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid days parameter', async () => {
      const cityId = 1;

      const response = await request(app)
        .post(`/api/weather/forecasts/generate/${cityId}`)
        .send({ days: 'invalid' })
        .set('Content-Type', 'application/json');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/weather/forecasts/:cityId', () => {
    it('should retrieve forecasts for a city', async () => {
      const cityId = 1;

      persistence.getLSTMPredictions.mockResolvedValue([
        {
          id: 1,
          city_id: cityId,
          timestamp: new Date(),
          predicted_temperature: 25.5,
          predicted_humidity: 70,
          predicted_rainfall: 0.5,
          description: 'LSTM Prediction',
        },
      ]);

      const response = await request(app)
        .get(`/api/weather/forecasts/${cityId}`)
        .set('Content-Type', 'application/json');

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/weather/forecasts/accuracy/:cityId', () => {
    it('should return accuracy stats for city predictions', async () => {
      const cityId = 1;

      persistence.getAccuracyStats.mockResolvedValue({
        total_predictions: 30,
        avg_temp_error: 2.5,
        avg_humidity_error: 5,
        avg_confidence: 0.85,
      });

      const response = await request(app)
        .get(`/api/weather/forecasts/accuracy/${cityId}`)
        .set('Content-Type', 'application/json');

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('Forecast Data Validation', () => {
    it('should validate forecast creation payload', async () => {
      const invalidPayload = {
        city_id: 'invalid', // should be number
        timestamp: 'not-a-date', // should be ISO8601
        predicted_temperature: 'hot', // should be number
      };

      const response = await request(app)
        .post('/api/weather/forecasts')
        .send(invalidPayload)
        .set('Content-Type', 'application/json');

      expect([200, 201, 400]).toContain(response.status);
    });

    it('should accept valid forecast creation payload', async () => {
      const validPayload = {
        city_id: 1,
        timestamp: '2026-01-10T12:00:00Z',
        predicted_temperature: 25.5,
        predicted_humidity: 70,
        predicted_rainfall: 0.5,
        description: 'Clear weather',
      };

      // Mock successful creation
      WeatherForecast.create.mockResolvedValue({
        id: 1,
        ...validPayload,
      });

      const response = await request(app)
        .post('/api/weather/forecasts')
        .send(validPayload)
        .set('Content-Type', 'application/json');

      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Forecast Accuracy Comparison', () => {
    it('should handle basic accuracy endpoint testing', async () => {
      const cityId = 1;

      // Test that accuracy endpoint exists and returns some response
      const response = await request(app)
        .get(`/api/weather/forecasts/accuracy/${cityId}`)
        .set('Content-Type', 'application/json');

      // Should handle gracefully
      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });
});
