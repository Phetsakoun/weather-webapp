// backend/services/modelService.js
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

// ใช้ PYTHON_API_URL -> ML_SERVICE_URL -> localhost
const BASE_URL =
  process.env.PYTHON_API_URL ||
  process.env.ML_SERVICE_URL ||
  'http://localhost:8000';

/**
 * ส่ง sequence weather data ไปให้ Python API (/predict)
 * @param {{ temperature: number[], humidity: number[], pressure: number[] }} seqData
 * @returns {Promise<any>} ผลลัพธ์จาก LSTM API
 */
async function predictWeather(seqData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/predict`,
      seqData, // <--- ต้องเป็น { temperature, humidity, pressure }
      { headers: { 'Content-Type': 'application/json' } }
    );
    // Python FastAPI return ตรงนี้เลย
    return response.data;
  } catch (err) {
    console.error('modelService.predictWeather error:', err.message);
    throw err;
  }
}

module.exports = { predictWeather };
