// backend/models/index.js
const sequelize = require('../config/database');
const Province = require('./provinceModel');
const City = require('./cityModel');
const Weather = require('./weatherModel');
const WeatherForecast = require('./weatherForecastModel');
const Notification = require('./notificationModel');

// กำหนด associations
Province.hasMany(City, { 
  foreignKey: 'province_id', 
  as: 'cities',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

City.belongsTo(Province, { 
  foreignKey: 'province_id', 
  as: 'province',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

// Weather associations
City.hasMany(Weather, {
  foreignKey: 'city_id',
  as: 'weatherRecords',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Weather.belongsTo(City, {
  foreignKey: 'city_id',
  as: 'weatherCity',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// WeatherForecast associations (optional - if needed)
// City.hasMany(WeatherForecast, {
//   foreignKey: 'city_id',
//   as: 'forecasts',
//   onDelete: 'CASCADE',
//   onUpdate: 'CASCADE'
// });

module.exports = {
  sequelize,
  Province,
  City,
  Weather,
  WeatherForecast,
  Notification
};
