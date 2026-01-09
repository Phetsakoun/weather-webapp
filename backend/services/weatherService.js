// backend/services/weatherService.js
const axios = require('axios');
require('dotenv').config();

const { TOMORROW_API_KEY } = process.env;
const { OPENWEATHER_API_KEY } = process.env;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/ingest_and_predict';

/**
 * OpenWeatherMap API - Current Weather
 */
async function fetchOpenWeatherCurrent(lat, lon) {
  console.log(`[API Call] fetchOpenWeatherCurrent called at ${new Date().toISOString()} for location: ${lat},${lon}`);

  try {
    const resp = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'en',
      },
      timeout: 10000,
    });

    const { data } = resp;
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      rainfall: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
      weatherCode: data.weather[0].id,
      weatherDescription: data.weather[0].description,
      weatherIcon: data.weather[0].icon,
      visibility: data.visibility,
      cloudiness: data.clouds.all,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      source: 'openweathermap',
    };
  } catch (error) {
    console.error('❌ OpenWeatherMap API Error:', error.message);
    console.error('❌ Response data:', error.response?.data);
    throw new Error(`OpenWeatherMap API failed: ${error.message}`);
  }
}

/**
 * OpenWeatherMap API - 5 Day Forecast
 */
async function fetchOpenWeatherForecast(lat, lon) {
  console.log(`[API Call] fetchOpenWeatherForecast called at ${new Date().toISOString()} for location: ${lat},${lon}`);

  try {
    const resp = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'en',
      },
      timeout: 10000,
    });

    const { data } = resp;
    const dailyData = {};

    // Group forecast data by day
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          temps: [],
          humidity: [],
          pressure: [],
          windSpeed: [],
          weather: [],
          precipitation: 0,
        };
      }

      dailyData[date].temps.push(item.main.temp);
      dailyData[date].humidity.push(item.main.humidity);
      dailyData[date].pressure.push(item.main.pressure);
      dailyData[date].windSpeed.push(item.wind.speed);
      dailyData[date].weather.push(item.weather[0]);

      // Add precipitation (rain + snow)
      if (item.rain) dailyData[date].precipitation += (item.rain['3h'] || 0);
      if (item.snow) dailyData[date].precipitation += (item.snow['3h'] || 0);
    });

    // Convert to daily summaries
    const dailyForecast = Object.values(dailyData).map((day) => ({
      time: new Date(day.date).toISOString(),
      values: {
        temperatureMax: Math.max(...day.temps),
        temperatureMin: Math.min(...day.temps),
        temperatureAvg: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
        humidity: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
        pressure: day.pressure.reduce((a, b) => a + b, 0) / day.pressure.length,
        windSpeed: day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length,
        precipitation: day.precipitation,
        weatherCode: day.weather[0].id,
        weatherDescription: day.weather[0].description,
        weatherIcon: day.weather[0].icon,
      },
    }));

    return dailyForecast;
  } catch (error) {
    console.error('❌ OpenWeatherMap Forecast API Error:', error.message);
    throw new Error(`OpenWeatherMap Forecast API failed: ${error.message}`);
  }
}

/**
 * 1) ดึงข้อมูลปัจจุบัน (realtime)
 */
async function fetchRealtime(lat, lon) {
  console.log(`[API Call] fetchRealtime Tomorrow.io called at ${new Date().toISOString()} for location: ${lat},${lon}`);

  try {
    const resp = await axios.get('https://api.tomorrow.io/v4/timelines', {
      params: {
        apikey: TOMORROW_API_KEY,
        location: `${lat},${lon}`,
        fields: ['temperature', 'humidity', 'pressureSeaLevel', 'windSpeed', 'precipitationIntensity', 'weatherCode'],
        timesteps: ['current'], // ขอข้อมูลปัจจุบัน
        units: 'metric',
      },
      timeout: 10000, // 10 seconds timeout
    });

    const v = resp.data.data.timelines[0].intervals[0].values;
    return {
      temperature: v.temperature,
      humidity: v.humidity,
      pressure: v.pressureSeaLevel,
      windSpeed: v.windSpeed,
      rainfall: v.precipitationIntensity || 0,
      weatherCode: v.weatherCode,
      source: 'tomorrow.io',
    };
  } catch (error) {
    console.error('❌ Tomorrow.io API Error:', error.message);
    console.error('❌ Response data:', error.response?.data);
    throw new Error(`Tomorrow.io API failed: ${error.message}`);
  }
}

/**
 * 2) ดึงพยากรณ์รายวัน (4 วัน รวมวันนี้)
 *    ส่วนที่เหลืออีก 3 วัน จะ mock data เพิ่มเอง
 */
async function fetchApiForecast(lat, lon) {
  console.log(`[API Call] fetchApiForecast Tomorrow.io called at ${new Date().toISOString()} for location: ${lat},${lon}`);

  // ขอ Tomorrow.io 4 วัน (รวมวันนี้)
  const resp = await axios.get('https://api.tomorrow.io/v4/timelines', {
    params: {
      apikey: TOMORROW_API_KEY,
      location: `${lat},${lon}`,
      fields: ['temperatureMax', 'temperatureMin', 'precipitationProbabilityAvg', 'precipitationIntensityAvg', 'windSpeed', 'weatherCode'],
      timesteps: ['1d'],
      startTime: 'now',
      endTime: 'nowPlus3d', // now + 3 วัน = รวมวันนี้เป็น 4 วัน
      units: 'metric',
    },
  });
  const { intervals } = resp.data.data.timelines[0];

  // แปลง response
  const realDays = intervals.map((iv) => ({
    time: iv.startTime,
    values: {
      temperatureMax: iv.values.temperatureMax,
      temperatureMin: iv.values.temperatureMin,
      precipitationProbabilityAvg: iv.values.precipitationProbabilityAvg,
      precipitationIntensityAvg: iv.values.precipitationIntensityAvg || 0,
      windSpeed: iv.values.windSpeed,
      weatherCodeMax: iv.values.weatherCode,
    },
  }));

  // mock อีก 3 วันให้ครบ 7 วัน
  const mockDays = Array.from({ length: 3 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + realDays.length + idx);
    return {
      time: d.toISOString(),
      values: {
        temperatureMax: 28 + Math.random() * 6,
        temperatureMin: 24 + Math.random() * 4,
        precipitationProbabilityAvg: Math.random() * 50,
        precipitationIntensityAvg: Math.random() * 10,
        windSpeed: Math.random() * 10,
        weatherCodeMax: 1000,
      },
    };
  });

  return realDays.concat(mockDays);
}

/**
 * 3) เรียก ML service (LSTM) เพื่อพยากรณ์ 7 วัน
 *    คาดว่า ML คืน { today: {...}, forecast: [7 วัน] }
 */
async function fetchModelForecast(lat, lon) {
  console.log(`[API Call] fetchModelForecast ML service called at ${new Date().toISOString()} for location: ${lat},${lon}`);

  const resp = await axios.post(
    ML_SERVICE_URL,
    null,
    { params: { lat, lon } },
  );
  // สมมติว่า ML service คืนโครงสร้างแบบนี้
  // { today: { temperature, weatherCode, precipitationProbability, windSpeed }, forecast: [...] }
  return resp.data;
}

/**
 * Combined Weather Service - Try OpenWeatherMap first, fallback to Tomorrow.io
 */
async function fetchCurrentWeather(lat, lon) {
  console.log(`[Combined API] fetchCurrentWeather called for location: ${lat},${lon}`);

  try {
    // Try OpenWeatherMap first
    return await fetchOpenWeatherCurrent(lat, lon);
  } catch (error) {
    console.log('OpenWeatherMap failed, trying Tomorrow.io as fallback...');
    try {
      return await fetchRealtime(lat, lon);
    } catch (fallbackError) {
      console.error('Both APIs failed:', error.message, fallbackError.message);
      // Return mock data as last resort
      return {
        temperature: 28 + Math.random() * 5,
        humidity: 60 + Math.random() * 30,
        pressure: 1013 + Math.random() * 20,
        windSpeed: Math.random() * 10,
        rainfall: Math.random() * 5,
        weatherCode: 1000,
        weatherDescription: 'Clear sky',
        source: 'mock-fallback',
      };
    }
  }
}

/**
 * Combined Forecast Service - Try OpenWeatherMap first, fallback to Tomorrow.io
 */
async function fetchCombinedForecast(lat, lon) {
  console.log(`[Combined API] fetchCombinedForecast called for location: ${lat},${lon}`);

  try {
    // Try OpenWeatherMap first
    return await fetchOpenWeatherForecast(lat, lon);
  } catch (error) {
    console.log('OpenWeatherMap forecast failed, trying Tomorrow.io as fallback...');
    try {
      return await fetchApiForecast(lat, lon);
    } catch (fallbackError) {
      console.error('Both forecast APIs failed:', error.message, fallbackError.message);
      // Return mock data as last resort
      return Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() + idx);
        return {
          time: d.toISOString(),
          values: {
            temperatureMax: 28 + Math.random() * 6,
            temperatureMin: 24 + Math.random() * 4,
            humidity: 60 + Math.random() * 30,
            precipitation: Math.random() * 10,
            windSpeed: Math.random() * 10,
            weatherCode: 1000,
            weatherDescription: 'Clear sky',
            source: 'mock-fallback',
          },
        };
      });
    }
  }
}

/**
 * Get current weather data for dashboard charts (24 hours)
 */
async function getCurrentWeatherData(cityId = 1) {
  try {
    // Mock data สำหรับ dashboard - ในอนาคตจะดึงจากฐานข้อมูลจริง
    const now = new Date();
    const weatherData = [];

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      weatherData.push({
        timestamp: timestamp.toISOString(),
        temperature: Math.round(25 + Math.sin(i / 4) * 5 + Math.random() * 3),
        humidity: Math.round(65 + Math.cos(i / 3) * 10 + Math.random() * 5),
        pressure: Math.round(1013 + Math.random() * 5),
        windSpeed: Math.round(5 + Math.random() * 3),
        rainfall: Math.round(Math.random() * 3 * 10) / 10, // 0-3mm with 1 decimal
        cityId,
      });
    }

    return weatherData;
  } catch (error) {
    console.error('Error generating current weather data:', error);
    throw error;
  }
}

/**
 * Get weather summary by provinces for comparison
 */
async function getProvinceWeatherSummary() {
  try {
    // Mock data สำหรับเปรียบเทียบจังหวัด
    const provinces = [
      {
        province_name: 'ວຽງຈັນ', avg_temperature: 28, avg_humidity: 65, avg_rainfall: 120,
      },
      {
        province_name: 'ລວງພະບາງ', avg_temperature: 26, avg_humidity: 70, avg_rainfall: 150,
      },
      {
        province_name: 'ປາກເຊ', avg_temperature: 32, avg_humidity: 60, avg_rainfall: 80,
      },
      {
        province_name: 'ສະຫວັນນະເຂດ', avg_temperature: 29, avg_humidity: 68, avg_rainfall: 100,
      },
      {
        province_name: 'ຈໍາປາສັກ', avg_temperature: 31, avg_humidity: 62, avg_rainfall: 90,
      },
      {
        province_name: 'ຜົ້ງສາລີ', avg_temperature: 24, avg_humidity: 75, avg_rainfall: 200,
      },
      {
        province_name: 'ແຂວງອຸດົມໄຊ', avg_temperature: 27, avg_humidity: 72, avg_rainfall: 180,
      },
      {
        province_name: 'ບໍ່ແກ້ວ', avg_temperature: 30, avg_humidity: 58, avg_rainfall: 60,
      },
    ];

    return provinces;
  } catch (error) {
    console.error('Error generating province weather summary:', error);
    throw error;
  }
}

module.exports = {
  fetchRealtime,
  fetchDaily: fetchApiForecast, // เดิมชื่อ fetchDaily ก็แทนด้วย fetchApiForecast
  fetchApiForecast,
  fetchModelForecast,
  // OpenWeatherMap functions
  fetchOpenWeatherCurrent,
  fetchOpenWeatherForecast,
  // Combined functions (recommended)
  fetchCurrentWeather,
  fetchCombinedForecast,
  // Dashboard functions
  getCurrentWeatherData,
  getProvinceWeatherSummary,
};
