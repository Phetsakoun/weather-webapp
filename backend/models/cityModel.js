// backend/models/cityModel.js
const { DataTypes } = require('sequelize');
const sequelize      = require('../config/database');

// กำหนดโมเดล City
const City = sequelize.define('City', {
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
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  lon: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  province_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null since some cities might not have province assigned
    references: { model: 'provinces', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  region: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'Central'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  tableName: 'cities',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// กำหนด associations
City.associate = (models) => {
  City.belongsTo(models.Province, { 
    foreignKey: 'province_id', 
    as: 'province',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  });
};

module.exports = City;
