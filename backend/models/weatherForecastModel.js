const persistence = require('../services/weatherPersistence');

class WeatherForecast {
  static async create(forecastData) {
    return persistence.createForecast(forecastData);
  }

  static async createBatch(forecastsData) {
    return persistence.createForecastBatch(forecastsData);
  }

  static async findAll(filters = {}) {
    return persistence.getForecasts(filters);
  }

  static async findById(id) {
    return persistence.getForecastById(id);
  }

  static async updateActualValues(id, actualData) {
    return persistence.updateForecastActualValues(id, actualData);
  }

  static async delete(id) {
    return persistence.deleteForecast(id);
  }

  static async findByCityAndDateRange(cityId, startDate, endDate) {
    return persistence.findForecastsByCityAndDateRange(cityId, startDate, endDate);
  }

  static async getLatestForecasts() {
    return persistence.getLatestForecasts();
  }

  static async getAccuracyStats(cityId = null, dateFrom = null, dateTo = null) {
    return persistence.getAccuracyStats(cityId, dateFrom, dateTo);
  }
}

module.exports = WeatherForecast;
