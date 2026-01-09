require('dotenv').config(); // โหลด .env ก่อนเลย
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME, // ชื่อ DB
  process.env.DATABASE_USER, // ยูสเซอร์
  process.env.DATABASE_PASSWORD, // รหัสผ่าน
  {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10), // แปลงเป็น Number
    dialect: process.env.DATABASE_DRIVER, // e.g. 'mysql'
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4',
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false,
    },
    timezone: '+07:00',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

module.exports = sequelize;
