const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeatherPrediction = sequelize.define('WeatherPrediction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cities',
      key: 'id'
    },
    comment: 'ID ຂອງເມືອງທີ່ທໍານາຍ'
  },
  predictionTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'ເວລາທີ່ທໍານາຍໄວ້'
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'ອຸນຫະພູມທີ່ທໍານາຍ (°C)'
  },
  precipitation: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'ປະລິມານຝົນທີ່ທໍານາຍ (mm)'
  },
  humidity: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'ຄວາມຊື້ນທີ່ທໍານາຍ (%)'
  },
  pressure: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'ຄວາມກົດອາກາດທີ່ທໍານາຍ (hPa)'
  },
  windSpeed: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'ຄວາມໄວລົມທີ່ທໍານາຍ (m/s)'
  },
  predictionType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'LSTM',
    comment: 'ປະເພດການທໍານາຍ (LSTM, ML, API)'
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.85,
    comment: 'ຄວາມເຊື່ອໝັ້ນໃນການທໍານາຍ (0.0-1.0)'
  },
  modelVersion: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '1.0',
    comment: 'ເວີຊັນຂອງໂມເດນ'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'ຂໍ້ມູນເພີ່ມເຕີມເຊັ່ນ lat, lon, algorithm, etc.'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'ສະຖານະການທໍານາຍ (ໃຊ້ງານ/ບໍ່ໃຊ້ງານ)'
  },
  predictedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'ເວລາທີ່ສ້າງການທໍານາຍ'
  }
}, {
  tableName: 'weather_predictions',
  timestamps: true,
  indexes: [
    {
      fields: ['cityId', 'predictionTime'],
      name: 'idx_city_prediction_time'
    },
    {
      fields: ['predictionType'],
      name: 'idx_prediction_type'
    },
    {
      fields: ['predictionTime'],
      name: 'idx_prediction_time'
    },
    {
      fields: ['isActive'],
      name: 'idx_is_active'
    }
  ]
});

module.exports = WeatherPrediction;
