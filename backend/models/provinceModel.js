// backend/models/provinceModel.js
const { DataTypes } = require('sequelize');
const sequelize      = require('../config/database');

const Province = sequelize.define('Province', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name_th: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name_en: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'provinces',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// กำหนด associations
Province.associate = (models) => {
  Province.hasMany(models.City, { 
    foreignKey: 'province_id', 
    as: 'cities',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
};

module.exports = Province;
