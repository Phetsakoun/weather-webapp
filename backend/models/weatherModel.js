// backend/models/weatherModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Weather = sequelize.define('Weather', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  temperature: { type: DataTypes.FLOAT, allowNull: false },
  humidity: { type: DataTypes.FLOAT, allowNull: false },
  pressure: { type: DataTypes.FLOAT, allowNull: false },
  wind_speed: { type: DataTypes.FLOAT, allowNull: true },
  rainfall: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
  description: { type: DataTypes.STRING, allowNull: true },
  timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  city_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'cities', key: 'id' },
  },
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: 'weather',
});

module.exports = Weather;
