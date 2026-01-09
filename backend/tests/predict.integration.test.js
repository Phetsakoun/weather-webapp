const request = require('supertest');
const express = require('express');
const nock = require('nock');

// Mock persistence and City model before loading routes/controllers
jest.mock('../services/weatherPersistence');
jest.mock('../models/cityModel');

const persistence = require('../services/weatherPersistence');
const City = require('../models/cityModel');

const weatherForecastRoutes = require('../routes/weatherForecastRoutes');

describe('Predict integration (backend -> ML -> DB)', () => {
  let app;

  beforeAll(() => {
    // Ensure ML_SERVICE_URL is set for the tested code
    process.env.ML_SERVICE_URL = 'http://127.0.0.1:5001';

    // Create express app and mount the route under test
    app = express();
    app.use(express.json());
    app.use('/api/weather/forecasts', weatherForecastRoutes);
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  test('generateLSTMPredictions calls ML and saves forecasts', async () => {
    const cityId = 1;

    // Mock City.findByPk to return a city with coordinates
    City.findByPk.mockResolvedValue({ id: cityId, name_th: 'TestCity', lat: 10.0, lon: 20.0 });

    // Mock ML response via nock
    const mlScope = nock('http://127.0.0.1:5001')
      .post('/ingest_and_predict')
      .query(true)
      .reply(200, {
        status: 'success',
        predictions: {
          times: ['2026-01-10','2026-01-11','2026-01-12'],
          temperatures: [25, 26, 27],
          humidities: [70, 72, 75],
          rainfalls: [0, 1, 0],
          pressures: [1012, 1013, 1011],
          wind_speeds: [3, 2.5, 4]
        }
      });

    // Mock persistence.createForecastBatch to pretend to insert
    persistence.createForecastBatch.mockResolvedValue({ insertedCount: 3, firstInsertId: 123 });

    const res = await request(app)
      .post(`/api/weather/forecasts/generate/${cityId}`)
      .send({ days: 3 })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(persistence.createForecastBatch).toHaveBeenCalled();
    expect(mlScope.isDone()).toBe(true);
  }, 20000);
});
