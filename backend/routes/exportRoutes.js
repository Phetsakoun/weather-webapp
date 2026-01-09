const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');

// ฟังก์ชันสำหรับเพิ่ม UTF-8 BOM ให้กับ CSV เพื่อรองรับภาษาลาวใน Excel
function addUTF8BOM(csvData) {
  // UTF-8 BOM เป็น bytes: EF BB BF
  const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
  const csvBuffer = Buffer.from(csvData, 'utf8');
  return Buffer.concat([BOM, csvBuffer]);
}

// Export data endpoints
router.get('/provinces', async (req, res) => {
  try {
    // สร้าง CSV data สำหรับจังหวัด
    const csvData = `Province,Cities,Population,Area
ວຽງຈັນ,9,820000,15000
ລວງພະບາງ,11,431000,16875
ປາກເຊ,10,370000,10320
ສະຫວັນນະເຂດ,9,825000,21774
ຈໍາປາສັກ,10,694000,15415`;

    // เพิ่ม UTF-8 BOM และตั้งค่า charset ที่ถูกต้อง
    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="provinces.csv"');
    res.end(csvWithBOM);
  } catch (error) {
    console.error('Error exporting provinces:', error);
    res.status(500).json({ error: 'Failed to export provinces data' });
  }
});

router.get('/users', async (req, res) => {
  try {
    // สร้าง CSV data สำหรับผู้ใช้
    const csvData = `ID,Username,Email,Role,Created
1,admin,admin@example.com,admin,2024-01-01
2,user1,user1@example.com,user,2024-01-15
3,user2,user2@example.com,user,2024-02-01`;

    // เพิ่ม UTF-8 BOM และตั้งค่า charset ที่ถูกต้อง
    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.end(csvWithBOM);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users data' });
  }
});

router.get('/weather', async (req, res) => {
  try {
    // สร้าง CSV data สำหรับข้อมูลอากาศ
    const csvData = `Date,City,Temperature,Humidity,Pressure
2024-01-01,ວຽງຈັນ,28,65,1013
2024-01-01,ລວງພະບາງ,26,70,1015
2024-01-01,ປາກເຊ,32,60,1012`;

    // เพิ่ม UTF-8 BOM และตั้งค่า charset ที่ถูกต้อง
    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="weather.csv"');
    res.end(csvWithBOM);
  } catch (error) {
    console.error('Error exporting weather:', error);
    res.status(500).json({ error: 'Failed to export weather data' });
  }
});

// Export ข้อมูลจังหวัดจากฐานข้อมูลจริง
router.get('/provinces/real', async (req, res) => {
  try {
    // ตรวจสอบว่าตาราง provinces มีอยู่หรือไม่
    const persistence = require('../services/weatherPersistence');
    const hasProvinces = await persistence.tableExists('provinces');

    if (!hasProvinces) {
      // หากไม่มีตาราง ให้ใช้ข้อมูลตัวอย่าง
      const csvData = `ລະຫັດ,ຊື່ຈັງຫວັດ (ລາວ),ຊື່ຈັງຫວັດ (ອັງກິດ),ພາກ
1,ນະຄອນຫຼວງວຽງຈັນ,Vientiane Capital,ພາກກາງ
2,ແຂວງອັດຕະປື,Attapeu,ພາກໃຕ້
3,ແຂວງບໍ່ແກ້ວ,Bokeo,ພາກເໜືອ
4,ແຂວງບໍລິຄໍາໄຊ,Bolikhamxai,ພາກກາງ
5,ແຂວງຈໍາປາສັກ,Champasak,ພາກໃຕ້`;

      const csvWithBOM = addUTF8BOM(csvData);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="provinces_sample.csv"');
      res.end(csvWithBOM);
      return;
    }

    const provinces = await persistence.getProvinces();

    // สร้าง CSV header ภาษาลาว
    let csvData = `ລະຫັດ,ຊື່ຈັງຫວັດ (ລາວ),ຊື່ຈັງຫວັດ (ອັງກິດ),ພາກ\n`;
    
    if (provinces.length === 0) {
      // หากไม่มีข้อมูล ให้เพิ่มข้อความแจ้ง
      csvData += `,,ບໍ່ມີຂໍ້ມູນຈັງຫວັດໃນຖານຂໍ້ມູນ,\n`;
    } else {
      // เพิ่มข้อมูลแต่ละแถว
      provinces.forEach(province => {
        csvData += `${province.id},"${province.name_th || 'ບໍ່ມີຂໍ້ມູນ'}","${province.name_en || 'N/A'}","${province.region || 'ບໍ່ມີຂໍ້ມູນ'}"\n`;
      });
    }

    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="provinces_real.csv"');
    res.end(csvWithBOM);
  } catch (error) {
    console.error('Error exporting real provinces:', error);
    
    // หากเกิดข้อผิดพลาด ให้ส่งข้อมูลตัวอย่างแทน
    const csvData = `ລະຫັດ,ຊື່ຈັງຫວັດ (ລາວ),ຊື່ຈັງຫວັດ (ອັງກິດ),ພາກ,ໝາຍເຫດ
1,ນະຄອນຫຼວງວຽງຈັນ,Vientiane Capital,ພາກກາງ,ຂໍ້ມູນຕົວຢ່າງ
2,ແຂວງອັດຕະປື,Attapeu,ພາກໃຕ້,ຂໍ້ມູນຕົວຢ່າງ
3,ແຂວງບໍ່ແກ້ວ,Bokeo,ພາກເໜືອ,ຂໍ້ມູນຕົວຢ່າງ`;

    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="provinces_fallback.csv"');
    res.send(csvWithBOM);
  }
});

// Export ข้อมูลเมืองจากฐานข้อมูลจริง
router.get('/cities/real', async (req, res) => {
  try {
    const persistence = require('../services/weatherPersistence');
    const cities = await persistence.getCitiesWithProvince();

    // สร้าง CSV header ภาษาลาว
    let csvData = `ລະຫັດ,ຊື່ເມືອງ (ລາວ),ຊື່ເມືອງ (ອັງກິດ),ລາຕິ​ຈຸດ,ລອງ​ຈິ​ຈຸດ,ຈັງຫວັດ\n`;
    
    // เพิ่มข้อมูลแต่ละแถว
    cities.forEach(city => {
      csvData += `${city.id},"${city.name_th || 'ບໍ່ມີຂໍ້ມູນ'}","${city.name_en || 'N/A'}",${city.lat || 0},${city.lon || 0},"${city.province_name || 'ບໍ່ມີຂໍ້ມູນ'}"\n`;
    });

    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cities_real.csv"');
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error exporting real cities:', error);
    res.status(500).json({ error: 'Failed to export cities data from database' });
  }
});

// Export ข้อมูลสภาพอากาศจากฐานข้อมูลจริง
router.get('/weather/real', async (req, res) => {
  try {
    const { days = 7 } = req.query; // จำนวนวันที่ต้องการ export (default 7 วัน)
    
    const persistence = require('../services/weatherPersistence');
    const weatherData = await persistence.getWeatherData(days);

    // สร้าง CSV header ภาษาลาว
    let csvData = `ລະຫັດ,ວັນທີ,ເມືອງ,ອຸນຫະພູມ (°C),ຄວາມຊຸ່ມ (%),ລົມ (m/s),ນ້ຳຝົນ (mm),ຄວາມກົດດັນ (hPa),ລາຍລະອຽດ\n`;
    
    // เพิ่มข้อมูลแต่ละแถว
    weatherData.forEach(weather => {
      const date = new Date(weather.timestamp).toLocaleString('lo-LA');
      csvData += `${weather.id},"${date}","${weather.city_name || 'ບໍ່ມີຂໍ້ມູນ'}",${weather.temperature || 0},${weather.humidity || 0},${weather.wind_speed || 0},${weather.rainfall || 0},${weather.pressure || 0},"${weather.description || 'ບໍ່ມີລາຍລະອຽດ'}"\n`;
    });

    const csvWithBOM = addUTF8BOM(csvData);
    
    const filename = `weather_data_${days}days.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error exporting real weather data:', error);
    res.status(500).json({ error: 'Failed to export weather data from database' });
  }
});

// Export ข้อมูลการพยากรณ์อากาศ LSTM
router.get('/forecast/real', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const persistence = require('../services/weatherPersistence');
    const forecastData = await persistence.getForecastData(days);

    // สร้าง CSV header ภาษาลาว
    let csvData = `ລະຫັດ,ວັນທີພາຍາກອນ,ເມືອງ,ອຸນຫະພູມທາຍ (°C),ຄວາມຊຸ່ມທາຍ (%),ນ້ຳຝົນທາຍ (mm),ລາຍລະອຽດ,ສ້າງເມື່ອ\n`;
    
    // เพิ่มข้อมูลแต่ละแถว
    forecastData.forEach(forecast => {
      const forecastDate = new Date(forecast.timestamp).toLocaleString('lo-LA');
      const createdDate = new Date(forecast.created_at).toLocaleString('lo-LA');
      csvData += `${forecast.id},"${forecastDate}","${forecast.city_name || 'ບໍ່ມີຂໍ້ມູນ'}",${forecast.predicted_temperature || 0},${forecast.predicted_humidity || 0},${forecast.predicted_rainfall || 0},"${forecast.description || 'ການພາຍາກອນ LSTM'}","${createdDate}"\n`;
    });

    const csvWithBOM = addUTF8BOM(csvData);
    
    const filename = `forecast_data_${days}days.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error exporting forecast data:', error);
    res.status(500).json({ error: 'Failed to export forecast data from database' });
  }
});

// Export รายงานสรุปสภาพอากาศ
router.get('/weather/summary', async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    
    const persistence = require('../services/weatherPersistence');
    const summaryData = await persistence.getWeatherSummary(month, year);

    // สร้าง CSV header ภาษาลาว
    let csvData = `ເມືອງ,ອຸນຫະພູມສະເລ່ຍ (°C),ອຸນຫະພູມສູງສຸດ (°C),ອຸນຫະພູມຕ່ຳສຸດ (°C),ຄວາມຊຸ່ມສະເລ່ຍ (%),ນ້ຳຝົນລວມ (mm),ຈຳນວນຂໍ້ມູນ\n`;
    
    if (summaryData.length === 0) {
      csvData += `ບໍ່ມີຂໍ້ມູນສຳລັບເດືອນ ${month}/${year},,,,,,\n`;
    } else {
      summaryData.forEach(summary => {
        csvData += `"${summary.city_name || 'ບໍ່ມີຂໍ້ມູນ'}",${summary.avg_temp || 0},${summary.max_temp || 0},${summary.min_temp || 0},${summary.avg_humidity || 0},${summary.total_rainfall || 0},${summary.data_count || 0}\n`;
      });
    }

    const csvWithBOM = addUTF8BOM(csvData);
    
    const filename = `weather_summary_${month}_${year}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error exporting weather summary:', error);
    
    // Fallback ส่งข้อมูลตัวอย่าง
    const csvData = `ເມືອງ,ອຸນຫະພູມສະເລ່ຍ (°C),ອຸນຫະພູມສູງສຸດ (°C),ອຸນຫະພູມຕ່ຳສຸດ (°C),ຄວາມຊຸ່ມສະເລ່ຍ (%),ນ້ຳຝົນລວມ (mm),ຈຳນວນຂໍ້ມູນ
ນະຄອນຫຼວງວຽງຈັນ,28.5,35.2,22.1,68.3,125.5,30
ແຂວງຫຼວງພະບາງ,26.8,32.1,20.5,72.1,89.2,28
ແຂວງຈໍາປາສັກ,30.2,38.5,24.8,65.7,78.3,25`;

    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="weather_summary_sample.csv"');
    res.send(csvWithBOM);
  }
});

// Export ข้อมูลพยากรณ์อากาศแบบละเอียด (รวมความน่าเชื่อถือ)
router.get('/forecast/detailed', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const persistence = require('../services/weatherPersistence');
    const detailedForecast = await persistence.getDetailedForecast(days);

    // สร้าง CSV header ภาษาลาว
    let csvData = `ລະຫັດ,ວັນທີພະຍາກອນ,ວັນໃນອາທິດ,ເມືອງ,ລາຕິຈຸດ,ລອງຈິຈຸດ,ອຸນຫະພູມ (°C),ໝວດອຸນຫະພູມ,ຄວາມຊຸ່ມ (%),ນ້ຳຝົນ (mm),ໝວດຝົນ,ຄວາມນ່າເຊື່ອຖື (%),ລາຍລະອຽດ,ສ້າງເມື່ອ\n`;
    
    if (detailedForecast.length === 0) {
      csvData += `,,,,,,,,,,ບໍ່ມີຂໍ້ມູນພະຍາກອນສຳລັບ ${days} ວັນຂ້າງໜ້າ,,,\n`;
    } else {
      detailedForecast.forEach(forecast => {
        const forecastDate = new Date(forecast.forecast_date).toLocaleDateString('lo-LA');
        const createdDate = new Date(forecast.created_at).toLocaleDateString('lo-LA');
        
        csvData += `${forecast.id},"${forecastDate}","${forecast.day_of_week || 'ບໍ່ຮູ້'}","${forecast.city_name || 'ບໍ່ມີຂໍ້ມູນ'}",${forecast.lat || 0},${forecast.lon || 0},${forecast.predicted_temperature || 0},"${forecast.temp_category}",${forecast.predicted_humidity || 0},${forecast.predicted_rainfall || 0},"${forecast.rain_category}",${forecast.confidence_score || 0},"${forecast.description || 'ການພະຍາກອນ LSTM'}","${createdDate}"\n`;
      });
    }

    const csvWithBOM = addUTF8BOM(csvData);
    
    const filename = `forecast_detailed_${days}days.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error exporting detailed forecast:', error);
    
    // Fallback ข้อมูลตัวอย่าง
    const csvData = `ລະຫັດ,ວັນທີພະຍາກອນ,ວັນໃນອາທິດ,ເມືອງ,ລາຕິຈຸດ,ລອງຈິຈຸດ,ອຸນຫະພູມ (°C),ໝວດອຸນຫະພູມ,ຄວາມຊຸ່ມ (%),ນ້ຳຝົນ (mm),ໝວດຝົນ,ຄວາມນ່າເຊື່ອຖື (%),ລາຍລະອຽດ,ສ້າງເມື່ອ
1,"${new Date(Date.now() + 86400000).toLocaleDateString('lo-LA')}","ອາທິດ","ນະຄອນຫຼວງວຽງຈັນ",17.9757,102.6331,29,"ອົບອຸ່ນ",70,5.2,"ຝົນປານກາງ",85,"ການພະຍາກອນ LSTM","${new Date().toLocaleDateString('lo-LA')}"
2,"${new Date(Date.now() + 172800000).toLocaleDateString('lo-LA')}","ຈັນ","ແຂວງຫຼວງພະບາງ",19.8856,102.1347,27,"ອົບອຸ່ນ",68,2.1,"ຝົນເບົາ",82,"ການພະຍາກອນ LSTM","${new Date().toLocaleDateString('lo-LA')}"`;

    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="forecast_detailed_sample.csv"');
    res.send(csvWithBOM);
  }
});

// Export ข้อมูลเปรียบเทียบความแม่นยำของการพยากรณ์
router.get('/forecast/accuracy', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const persistence = require('../services/weatherPersistence');
    const accuracyData = await persistence.getForecastAccuracy(days);

    // สร้าง CSV header ภาษาลาว
    let csvData = `ເມືອງ,ວັນທີ,ອຸນຫະພູມພະຍາກອນ,ອຸນຫະພູມຈິງ,ຄວາມຜິດພາດອຸນຫະພູມ,ຄວາມຊຸ່ມພະຍາກອນ,ຄວາມຊຸ່ມຈິງ,ຄວາມຜິດພາດຄວາມຊຸ່ມ,ນ້ຳຝົນພະຍາກອນ,ນ້ຳຝົນຈິງ,ຄວາມຜິດພາດນ້ຳຝົນ,ຄະແນນຄວາມເຊື່ອຖື\n`;
    
    if (accuracyData.length === 0) {
      csvData += `ບໍ່ມີຂໍ້ມູນການເປຣຽບທຽບສຳລັບ ${days} ວັນທີ່ຜ່ານມາ,,,,,,,,,,,\n`;
    } else {
      accuracyData.forEach(data => {
        const forecastDate = new Date(data.forecast_date).toLocaleDateString('lo-LA');
        
        csvData += `"${data.city_name || 'ບໍ່ມີຂໍ້ມູນ'}","${forecastDate}",${data.predicted_temperature || 0},${data.actual_temperature || 0},${data.temp_error || 0},${data.predicted_humidity || 0},${data.actual_humidity || 0},${data.humidity_error || 0},${data.predicted_rainfall || 0},${data.actual_rainfall || 0},${data.rainfall_error || 0},${data.confidence_score || 0}\n`;
      });
    }

    const csvWithBOM = addUTF8BOM(csvData);
    
    const filename = `forecast_accuracy_${days}days.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvWithBOM);
  } catch (error) {
    console.error('Error exporting forecast accuracy:', error);
    
    // Fallback ข้อมูลตัวอย่าง
    const csvData = `ເມືອງ,ວັນທີ,ອຸນຫະພູມພະຍາກອນ,ອຸນຫະພູມຈິງ,ຄວາມຜິດພາດອຸນຫະພູມ,ຄວາມຊຸ່ມພະຍາກອນ,ຄວາມຊຸ່ມຈິງ,ຄວາມຜິດພາດຄວາມຊຸ່ມ,ນ້ຳຝົນພະຍາກອນ,ນ້ຳຝົນຈິງ,ຄວາມຜິດພາດນ້ຳຝົນ,ຄະແນນຄວາມເຊື່ອຖື
"ນະຄອນຫຼວງວຽງຈັນ","${new Date().toLocaleDateString('lo-LA')}",28.5,29.2,0.7,68,70,2,5.2,4.8,0.4,85
"ແຂວງຫຼວງພະບາງ","${new Date().toLocaleDateString('lo-LA')}",26.8,27.1,0.3,72,74,2,2.1,1.9,0.2,88`;

    const csvWithBOM = addUTF8BOM(csvData);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="forecast_accuracy_sample.csv"');
    res.send(csvWithBOM);
  }
});

module.exports = router;
