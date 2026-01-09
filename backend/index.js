require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const sequelize  = require('./config/database');
const cron       = require('node-cron');
const { fetchAndSaveWeather } = require('./controllers/weatherController');

const authRoutes    = require('./routes/authRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const weatherForecastRoutes = require('./routes/weatherForecastRoutes'); // เพิ่มบรรทัดนี้
const predictRoutes = require('./routes/predictRoutes');
const newsRoutes = require('./routes/newsRoutes');
const youtubeRoutes = require('./routes/youtubeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const provinceRoutes = require('./routes/provinceRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');
const cityRoutes = require('./routes/cityRoutes');
const exportRoutes = require('./routes/exportRoutes');
const systemRoutes = require('./routes/systemRoutes');
const lstmRoutes = require('./routes/lstmRoutes');
const passport = require('passport');

require('./models/provinceModel');
require('./models/cityModel');
require('./models/weatherModel');
require('./models/userModel');
require('./models/newsModel');
require('./models/youtubeModel');
require('./models/notificationModel');
require('./config/passport');

// ตัวอย่าง cityConfigs (18 เมืองหลัก)
const cityConfigs = [
  { province: 'ນະຄອນຫລວງວຽງຈັນ', city: 'ນະຄອນຫລວງວຽງຈັນ', lat: 17.9757, lon: 102.6331, cityId: 1 },
  { province: 'ແຂວງອັດຕະປື', city: 'ເມືອງສາມັກຄີໄຊ', lat: 14.8000, lon: 106.8333, cityId: 2 },
  { province: 'ແຂວງບໍແກ້ວ', city: 'ເມືອງຫ້ວຍຊາຍ', lat: 20.2667, lon: 100.4167, cityId: 3 },
  { province: 'ແຂວງບໍລິຄໍາໄຊ', city: 'ເມືອງປາກຊັນ', lat: 18.3667, lon: 103.6667, cityId: 4 },
  { province: 'ແຂວງຈໍາປາສັກ', city: 'ເມືອງປາກເຊ', lat: 15.1167, lon: 105.8167, cityId: 5 },
  { province: 'ແຂວງຫົວພັນ', city: 'ເມືອງຊໍາເໜືອ', lat: 20.4167, lon: 104.0500, cityId: 6 },
  { province: 'ແຂວງຄໍາມ່ວນ', city: 'ເມືອງທ່າແຂກ', lat: 17.4000, lon: 104.8000, cityId: 7 },
  { province: 'ແຂວງຫລວງນໍ້າທາ', city: 'ເມືອງຫລວງນໍ້າທາ', lat: 20.9500, lon: 101.4000, cityId: 8 },
  { province: 'ແຂວງຫລວງພະບາງ', city: 'ເມືອງຫລວງພະບາງ', lat: 19.8856, lon: 102.1347, cityId: 9 },
  { province: 'ແຂວງອຸດົມໄຊ', city: 'ເມືອງໄຊ', lat: 20.6833, lon: 101.9833, cityId: 10 },
  { province: 'ແຂວງຜົ້ງສາລີ', city: 'ເມືອງຜົ້ງສາລີ', lat: 21.6830, lon: 101.9500, cityId: 11 },
  { province: 'ແຂວງສາລະວັນ', city: 'ເມືອງສາລະວັນ', lat: 15.7167, lon: 106.4167, cityId: 12 },
  { province: 'ແຂວງສະຫວັນນະເຂດ', city: 'ເມືອງໄກສອນພົມວິຫານ', lat: 16.5667, lon: 104.7500, cityId: 13 },
  { province: 'ແຂວງເຊກອງ', city: 'ເມືອງລະມາມ', lat: 15.3500, lon: 106.7167, cityId: 14 },
  { province: 'ແຂວງວຽງຈັນ', city: 'ເມືອງໂພນໂຮງ', lat: 18.4937, lon: 102.4103, cityId: 15 },
  { province: 'ແຂວງໄຊຍະບູລີ', city: 'ເມືອງໄຊຍະບູລີ', lat: 19.2500, lon: 101.7500, cityId: 16 },
  { province: 'ແຂວງຊຽງຂວາງ', city: 'ເມືອງໂພນສະຫວັນ', lat: 19.4500, lon: 103.1833, cityId: 17 },
  { province: 'ແຂວງໄຊສົມບູນ', city: 'ເມືອງອະນຸວົງ', lat: 18.9050, lon: 103.1000, cityId: 18 },
];

const app  = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // disable the `X-RateLimit-*` headers
});

// CORS Configuration (adjust for production)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

// 1) Middleware
app.use(helmet()); // Add security headers
app.use(limiter); // Apply rate limiting globally
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded images
app.use(passport.initialize());
// 2) API Routes
app.use('/api/auth',    authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/weather/forecasts', weatherForecastRoutes); // เพิ่มบรรทัดนี้
app.use('/api/predict', predictRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/lstm', lstmRoutes);
// 404 handler
app.use('/api/*', (req, res) =>
  res.status(404).json({ message: 'API endpoint not found.' })
);
// 3) Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// === Enhanced Dynamic Weather Fetching System ===
// ระบบการดึงข้อมูลอากาศที่ปรับความถี่ตามเงื่อนไข:
// - ช่วง 30 นาทีแรก: บันทึกทุกๆ 3 นาที (เพื่อเก็บข้อมูลอย่างละเอียดในช่วงเริ่มต้น)
// - หลังจาก 30 นาที: บันทึกทุกๆ 1 ชั่วโมง (เพื่อประหยัด API calls และ storage)

// 4) Start Server + Cron job (หลัง DB พร้อมแล้ว)
;(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected and authenticated');
    await sequelize.sync({ force: false });
    console.log('✅ DB schemas synced');

    console.log('🕐 Starting weather data collection system...');
    console.log('⏰ Cron schedule: Every hour at minute 0 (0 * * * *)');
    console.log('📊 Will collect data from Tomorrow.io and OpenWeatherMap APIs');
    console.log('💾 Data will be saved to weather table in database');
    console.log('🌍 Monitoring', cityConfigs.length, 'cities in Laos');
    
    // === Simple cron job: fetch/save weather ทุกๆ 1 ชั่วโมง ===
    cron.schedule('0 * * * *', async () => {
      console.log('[CRON] Fetching & saving weather for all cities...');
      for (const city of cityConfigs) {
        try {
          console.log(`[CRON][${city.city}] Fetching weather data...`);
          await fetchAndSaveWeather(
            { query: { lat: city.lat, lon: city.lon, cityId: city.cityId } },
            { json: data => console.log(`[CRON][${city.city}] ✅ Success`), status: () => ({ json: console.error }) }
          );
        } catch (err) {
          console.error(`[CRON] ❌ Error for ${city.city}:`, err.message);
        }
      }
      console.log('[CRON] Weather fetch/save complete!');
    });

    // === Optional: Demo cron job for testing (uncomment to enable) ===
    // หากต้องการทดสอบระบบให้ทำงานทุกๆ 30 วินาที ให้ uncomment โค้ดด้านล่าง
    /*
    cron.schedule('* * * * * *', async () => {
      console.log('[DEMO] Testing weather fetch every 30 seconds...');
      const testCity = cityConfigs[0]; // ทดสอบกับเมืองแรก
      try {
        await fetchAndSaveWeather(
          { query: { lat: testCity.lat, lon: testCity.lon, cityId: testCity.cityId } },
          { json: data => console.log(`[DEMO] ✅ Success for ${testCity.city}`), status: () => ({ json: console.error }) }
        );
      } catch (err) {
        console.error(`[DEMO] ❌ Error:`, err.message);
      }
    });
    */

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      
      // Initialize weather alert system
      const { initializeWeatherAlertSystem } = require('./controllers/notificationController');
      initializeWeatherAlertSystem();
      
      // Initialize LSTM Auto-Prediction System
      const { initializeLSTMSystem } = require('./controllers/lstmController');
      initializeLSTMSystem(cityConfigs);
    });
  } catch (error) {
    console.error('❌ Server start error:', error);
    process.exit(1);
  }
})();
