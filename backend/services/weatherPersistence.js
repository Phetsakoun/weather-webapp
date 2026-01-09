const Weather = require('../models/weatherModel');
const sequelize = require('../config/database');

/**
 * Get forecasts with optional pagination and filters
 * filters: { limit, offset, city_id }
 */
async function getForecasts(filters = {}) {
  const limit = parseInt(filters.limit) || 100;
  const offset = parseInt(filters.offset) || 0;

  let query = `
    SELECT 
      wf.*,
      c.name_th as city_name_th,
      c.name_en as city_name_en,
      c.lat,
      c.lon
    FROM weatherforecast wf
    LEFT JOIN cities c ON wf.city_id = c.id
  `;

  const params = [];
  if (filters.city_id) {
    query += ' WHERE wf.city_id = ?';
    params.push(filters.city_id);
  }

  query += ' ORDER BY wf.timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = await sequelize.query(query, {
    replacements: params,
    type: sequelize.QueryTypes.SELECT
  });
  return rows;
}

async function getRecentActualWeather(limit = 200) {
  const query = `
    SELECT 
      w.*,
      c.name_th as city_name_th,
      c.name_en as city_name_en
    FROM weather w
    LEFT JOIN cities c ON w.city_id = c.id
    ORDER BY w.timestamp DESC
    LIMIT ?
  `;
  const rows = await sequelize.query(query, {
    replacements: [parseInt(limit)],
    type: sequelize.QueryTypes.SELECT
  });
  return rows;
}

async function getRainfallComparison({ city_id = null, date_from = null, date_to = null, limit = 30 } = {}) {
  // Default date_from = 30 days ago if not provided
  const dateFrom = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Build query joining weather and weatherforecast by date and city
  let whereClause = 'WHERE w.timestamp >= ? AND w.rainfall IS NOT NULL';
  const params = [dateFrom.toISOString().slice(0, 19).replace('T', ' ')];

  if (city_id) {
    whereClause = 'WHERE w.city_id = ? AND w.timestamp >= ? AND w.rainfall IS NOT NULL';
    params.unshift(city_id); // now [city_id, dateFrom]
  }

  const query = `
    SELECT
      DATE(w.timestamp) as date,
      w.city_id,
      c.name_th as cityName,
      AVG(w.rainfall) as actual_rainfall,
      AVG(wf.predicted_rainfall) as predicted_rainfall,
      COUNT(*) as data_points
    FROM weather w
    LEFT JOIN weatherforecast wf ON DATE(w.timestamp) = DATE(wf.timestamp) AND w.city_id = wf.city_id
    LEFT JOIN cities c ON w.city_id = c.id
    ${whereClause}
    GROUP BY DATE(w.timestamp), w.city_id, c.name_th
    ORDER BY date DESC
    LIMIT ?
  `;

  params.push(parseInt(limit));

  const rows = await sequelize.query(query, {
    replacements: params,
    type: sequelize.QueryTypes.SELECT
  });

  return rows;
}

// Historical weather data for LSTM (wrapper around raw SQL)
async function getHistoricalWeatherData(cityId, days = 30, limit = 1000) {
  const query = `
    SELECT 
      temperature,
      humidity,
      pressure,
      wind_speed,
      rainfall,
      description,
      timestamp as recorded_at
    FROM weather
    WHERE city_id = ?
      AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  const rows = await sequelize.query(query, {
    replacements: [cityId, days, parseInt(limit)],
    type: sequelize.QueryTypes.SELECT
  });

  return rows;
}

async function getWeatherStatistics(cityId, days = 30) {
  const query = `
    SELECT 
      AVG(temperature) as avg_temp,
      MIN(temperature) as min_temp,
      MAX(temperature) as max_temp,
      AVG(humidity) as avg_humidity,
      AVG(pressure) as avg_pressure,
      AVG(wind_speed) as avg_wind_speed,
      SUM(rainfall) as total_rainfall,
      COUNT(*) as record_count
    FROM weather
    WHERE city_id = ?
      AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
  `;

  const [stats] = await sequelize.query(query, {
    replacements: [cityId, days],
    type: sequelize.QueryTypes.SELECT
  });

  return stats;
}

// Check if a forecast exists for city at timestamp (exact match)
async function existsForecastForCityAt(cityId, timestamp) {
  const query = `SELECT id FROM weatherforecast WHERE city_id = ? AND timestamp = ? AND description LIKE '%LSTM Prediction%' LIMIT 1`;
  const rows = await sequelize.query(query, {
    replacements: [cityId, timestamp],
    type: sequelize.QueryTypes.SELECT
  });
  return rows && rows.length > 0;
}

// Delete old LSTM forecasts older than provided cutoff (ISO datetime string)
async function deleteOldLSTMPredictions(cutoffIsoDatetime) {
  const query = `
    DELETE FROM weatherforecast
    WHERE created_at < ?
      AND description LIKE '%LSTM Prediction%'
  `;
  const [result] = await sequelize.query(query, {
    replacements: [cutoffIsoDatetime],
    type: sequelize.QueryTypes.DELETE
  });
  return result;
}

// Get LSTM-specific forecasts (with optional cityId and days ahead)
async function getLSTMPredictions({ cityId = null, days = 7, limit = 100 } = {}) {
  let query = `
    SELECT
      wf.*,
      c.name_th as city_name_th,
      c.name_en as city_name_en,
      c.lat,
      c.lon
    FROM weatherforecast wf
    LEFT JOIN cities c ON wf.city_id = c.id
    WHERE wf.description LIKE '%LSTM Prediction%'
  `;

  const params = [];
  if (cityId) {
    query += ' AND wf.city_id = ?';
    params.push(cityId);
  }

  const futureDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
  query += ' AND wf.timestamp BETWEEN NOW() AND ?';
  params.push(futureDate.toISOString().slice(0, 19).replace('T', ' '));

  query += ' ORDER BY wf.timestamp ASC LIMIT ?';
  params.push(parseInt(limit));

  const rows = await sequelize.query(query, {
    replacements: params,
    type: sequelize.QueryTypes.SELECT
  });

  return rows;
}

// --- Export helpers ---
async function tableExists(tableName) {
  const query = `SHOW TABLES LIKE ?`;
  const rows = await sequelize.query(query, {
    replacements: [tableName],
    type: sequelize.QueryTypes.SELECT
  });
  return rows && rows.length > 0;
}

async function getProvinces() {
  const query = `SELECT id, name_th, name_en, region FROM provinces ORDER BY id`;
  const rows = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  return rows;
}

async function getCitiesWithProvince() {
  const query = `
    SELECT c.id, c.name_th, c.name_en, c.lat, c.lon, p.name_th as province_name
    FROM cities c
    LEFT JOIN provinces p ON c.province_id = p.id
    ORDER BY c.id`;
  const rows = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  return rows;
}

async function getWeatherData(days = 7) {
  const query = `
    SELECT w.id, w.timestamp, c.name_th as city_name, w.temperature,
           w.humidity, w.wind_speed, w.rainfall, w.pressure, w.description
    FROM weather w
    LEFT JOIN cities c ON w.city_id = c.id
    WHERE w.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY w.timestamp DESC, c.name_th`;
  const rows = await sequelize.query(query, {
    replacements: [parseInt(days)],
    type: sequelize.QueryTypes.SELECT
  });
  return rows;
}

async function getForecastData(days = 7) {
  const query = `
    SELECT wf.id, wf.timestamp, c.name_th as city_name,
           wf.predicted_temperature, wf.predicted_humidity, wf.predicted_rainfall,
           wf.description, wf.created_at
    FROM weatherforecast wf
    LEFT JOIN cities c ON wf.city_id = c.id
    WHERE wf.timestamp >= NOW() AND wf.timestamp <= DATE_ADD(NOW(), INTERVAL ? DAY)
    ORDER BY wf.timestamp ASC, c.name_th`;
  const rows = await sequelize.query(query, {
    replacements: [parseInt(days)],
    type: sequelize.QueryTypes.SELECT
  });
  return rows;
}

async function getWeatherSummary(month, year) {
  const query = `
    SELECT 
      c.name_th as city_name,
      ROUND(AVG(w.temperature), 2) as avg_temp,
      ROUND(MAX(w.temperature), 2) as max_temp,
      ROUND(MIN(w.temperature), 2) as min_temp,
      ROUND(AVG(w.humidity), 2) as avg_humidity,
      ROUND(SUM(w.rainfall), 2) as total_rainfall,
      COUNT(*) as data_count
    FROM weather w
    LEFT JOIN cities c ON w.city_id = c.id
    WHERE MONTH(w.timestamp) = ? AND YEAR(w.timestamp) = ?
    GROUP BY c.id, c.name_th
    ORDER BY c.name_th`;
  const rows = await sequelize.query(query, {
    replacements: [parseInt(month), parseInt(year)],
    type: sequelize.QueryTypes.SELECT
  });
  return rows;
}

async function getDetailedForecast(days = 7) {
  const query = `
    SELECT 
      wf.id, 
      wf.timestamp as forecast_date,
      c.name_th as city_name,
      c.lat, c.lon,
      wf.predicted_temperature,
      wf.predicted_humidity, 
      wf.predicted_rainfall,
      wf.confidence_score,
      wf.description,
      wf.created_at,
      DATE_FORMAT(wf.timestamp, '%W') as day_of_week,
      CASE 
        WHEN wf.predicted_temperature >= 35 THEN 'ຮ້ອນຈັດ'
        WHEN wf.predicted_temperature >= 30 THEN 'ຮ້ອນ' 
        WHEN wf.predicted_temperature >= 25 THEN 'ອົບອຸ່ນ'
        WHEN wf.predicted_temperature >= 20 THEN 'ເຢັນ'
        ELSE 'ຫນາວ'
      END as temp_category,
      CASE
        WHEN wf.predicted_rainfall >= 20 THEN 'ຝົນໜັກ'
        WHEN wf.predicted_rainfall >= 5 THEN 'ຝົນປານກາງ'
        WHEN wf.predicted_rainfall > 0 THEN 'ຝົນເບົາ'
        ELSE 'ບໍ່ມີຝົນ'
      END as rain_category
    FROM weatherforecast wf
    LEFT JOIN cities c ON wf.city_id = c.id
    WHERE wf.timestamp >= NOW() AND wf.timestamp <= DATE_ADD(NOW(), INTERVAL ? DAY)
    ORDER BY wf.timestamp ASC, c.name_th`;
  const rows = await sequelize.query(query, {
    replacements: [parseInt(days)],
    type: sequelize.QueryTypes.SELECT
  });
  return rows;
}

async function getForecastAccuracy(days = 30) {
  const query = `
    SELECT 
      c.name_th as city_name,
      DATE(wf.timestamp) as forecast_date,
      wf.predicted_temperature,
      w.temperature as actual_temperature,
      wf.predicted_humidity,
      w.humidity as actual_humidity,
      wf.predicted_rainfall,
      w.rainfall as actual_rainfall,
      ABS(wf.predicted_temperature - w.temperature) as temp_error,
      ABS(wf.predicted_humidity - w.humidity) as humidity_error,
      ABS(wf.predicted_rainfall - w.rainfall) as rainfall_error,
      wf.confidence_score
    FROM weatherforecast wf
    LEFT JOIN cities c ON wf.city_id = c.id
    LEFT JOIN weather w ON (c.id = w.city_id AND DATE(wf.timestamp) = DATE(w.timestamp))
    WHERE wf.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND wf.timestamp <= NOW()
      AND w.temperature IS NOT NULL
    ORDER BY wf.timestamp DESC, c.name_th`;
  const rows = await sequelize.query(query, {
    replacements: [parseInt(days)],
    type: sequelize.QueryTypes.SELECT
  });
  return rows;
}

// --- Forecast create/update/delete helpers moved from model ---
async function createForecast(forecastData) {
  const {
    city_id,
    timestamp,
    predicted_temperature,
    predicted_humidity,
    predicted_rainfall = 0,
    description = null
  } = forecastData;

  const query = `
    INSERT INTO weatherforecast (
      city_id, timestamp, predicted_temperature, predicted_humidity,
      predicted_rainfall, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  try {
    const [result] = await sequelize.query(query, {
      replacements: [city_id, timestamp, predicted_temperature, predicted_humidity, predicted_rainfall, description],
      type: sequelize.QueryTypes.INSERT
    });
    return { id: result, ...forecastData };
  } catch (error) {
    console.error('Error creating weather forecast (persistence):', error);
    throw error;
  }
}

async function createForecastBatch(forecastsData) {
  if (!forecastsData || forecastsData.length === 0) return { insertedCount: 0 };

  const placeholders = forecastsData.map(() => '(?, ?, ?, ?, ?, ?, NOW())').join(', ');
  const query = `
    INSERT INTO weatherforecast (
      city_id, timestamp, predicted_temperature, predicted_humidity,
      predicted_rainfall, description, created_at
    ) VALUES ${placeholders}
  `;

  const values = [];
  forecastsData.forEach(forecast => {
    values.push(
      forecast.city_id,
      forecast.timestamp,
      forecast.predicted_temperature,
      forecast.predicted_humidity,
      forecast.predicted_rainfall || 0,
      forecast.description || null
    );
  });

  try {
    const [result] = await sequelize.query(query, {
      replacements: values,
      type: sequelize.QueryTypes.INSERT
    });
    return { insertedCount: result.affectedRows || forecastsData.length, firstInsertId: result };
  } catch (error) {
    console.error('Error creating batch forecasts (persistence):', error);
    throw error;
  }
}

async function getForecastById(id) {
  const query = `
    SELECT 
      wf.*, c.name_th as city_name_th, c.name_en as city_name_en, c.lat, c.lon
    FROM weatherforecast wf
    LEFT JOIN cities c ON wf.city_id = c.id
    WHERE wf.id = ?
  `;
  const rows = await sequelize.query(query, { replacements: [id], type: sequelize.QueryTypes.SELECT });
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return { ...row, cityName: row.city_name_th || row.city_name_en || 'Unknown City' };
}

async function updateForecastActualValues(id, actualData) {
  const { actual_temperature, actual_humidity, actual_rainfall } = actualData;
  const query = `
    UPDATE weatherforecast 
    SET actual_temperature = ?, actual_humidity = ?, actual_rainfall = ?
    WHERE id = ?
  `;
  const [result] = await sequelize.query(query, {
    replacements: [actual_temperature, actual_humidity, actual_rainfall, id],
    type: sequelize.QueryTypes.UPDATE
  });
  return result.affectedRows > 0;
}

async function deleteForecast(id) {
  const query = 'DELETE FROM weatherforecast WHERE id = ?';
  const [result] = await sequelize.query(query, { replacements: [id], type: sequelize.QueryTypes.DELETE });
  return result.affectedRows > 0;
}

async function findForecastsByCityAndDateRange(cityId, startDate, endDate) {
  const query = `
    SELECT wf.*, c.name_th as city_name_th, c.name_en as city_name_en
    FROM weatherforecast wf
    LEFT JOIN cities c ON wf.city_id = c.id
    WHERE wf.city_id = ? AND wf.timestamp BETWEEN ? AND ?
    ORDER BY wf.timestamp ASC
  `;
  const rows = await sequelize.query(query, {
    replacements: [cityId, startDate, endDate],
    type: sequelize.QueryTypes.SELECT
  });
  return rows.map(row => ({ ...row, cityName: row.city_name_th || row.city_name_en || 'Unknown City' }));
}

async function getLatestForecasts() {
  const query = `
    SELECT wf.*, c.name_th as city_name_th, c.name_en as city_name_en, c.lat, c.lon
    FROM weatherforecast wf
    LEFT JOIN cities c ON wf.city_id = c.id
    WHERE wf.id IN (
      SELECT MAX(id) FROM weatherforecast GROUP BY city_id
    )
    ORDER BY wf.timestamp DESC
  `;
  const rows = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  return rows.map(row => ({ ...row, cityName: row.city_name_th || row.city_name_en || 'Unknown City' }));
}

async function getAccuracyStats(cityId = null, dateFrom = null, dateTo = null) {
  let query = `
    SELECT 
      COUNT(*) as total_predictions,
      AVG(ABS(predicted_temperature - actual_temperature)) as avg_temp_error,
      AVG(ABS(predicted_humidity - actual_humidity)) as avg_humidity_error,
      AVG(confidence) as avg_confidence,
      MIN(timestamp) as earliest_prediction,
      MAX(timestamp) as latest_prediction
    FROM weatherforecast 
    WHERE actual_temperature IS NOT NULL AND actual_humidity IS NOT NULL
  `;
  const params = [];
  if (cityId) { query += ' AND city_id = ?'; params.push(cityId); }
  if (dateFrom) { query += ' AND timestamp >= ?'; params.push(dateFrom); }
  if (dateTo) { query += ' AND timestamp <= ?'; params.push(dateTo); }
  const rows = await sequelize.query(query, { replacements: params, type: sequelize.QueryTypes.SELECT });
  return rows[0];
}

/**
 * Persistence helper for weather-related DB operations.
 * Keep thin wrappers around models so controllers can call simple functions.
 */

async function getRecentWeatherByCity(cityId, limit = 24) {
  return Weather.findAll({
    where: { city_id: cityId },
    order: [['timestamp', 'DESC']],
    limit
  });
}

async function createWeatherEntry(data) {
  return Weather.create(data);
}

async function saveForecast(forecast) {
  // forecast is expected to use snake_case keys matching weatherforecast table
  return WeatherForecast.create(forecast);
}

async function createForecastBatch(forecasts) {
  return WeatherForecast.createBatch(forecasts);
}

module.exports = {
  getRecentWeatherByCity,
  createWeatherEntry,
  saveForecast,
  createForecastBatch
  , getForecasts, getRecentActualWeather, getRainfallComparison, getHistoricalWeatherData, getWeatherStatistics, existsForecastForCityAt, deleteOldLSTMPredictions, getLSTMPredictions
  , tableExists, getProvinces, getCitiesWithProvince, getWeatherData, getForecastData, getWeatherSummary, getDetailedForecast, getForecastAccuracy
  , createForecast, getForecastById, updateForecastActualValues, deleteForecast, findForecastsByCityAndDateRange, getLatestForecasts, getAccuracyStats
};
