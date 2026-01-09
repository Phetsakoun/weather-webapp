const { sequelize, Province, City, Weather, WeatherForecast } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('DB auth OK');

    // Minimal provinces (will be referenced by cities)
    const provincesData = [
      { id: 1, name_th: 'ນະຄອນຫຼວງວຽງຈັນ', name_en: 'Vientiane Capital' },
      { id: 2, name_th: 'ຫຼວງພະບາງ', name_en: 'Luang Prabang' },
      { id: 3, name_th: 'ປາກເຊ', name_en: 'Pakse' }
    ];

    for (const p of provincesData) {
      await Province.findOrCreate({ where: { id: p.id }, defaults: p });
    }

    // Cities list used by LSTM cron — minimal seed (IDs 1..18)
    const cities = [
      { id:1, name_th:'ນະຄອນຫຼວງວຽງຈັນ', name_en:'Vientiane', lat:17.9757, lon:102.6331, province_id:1 },
      { id:2, name_th:'ເມືອງສາມັກຄີໄຊ', name_en:'Samakkixay', lat:14.8, lon:106.8333, province_id:3 },
      { id:3, name_th:'ເມືອງຫ້ວຍຊາຍ', name_en:'Huay Xai', lat:20.2667, lon:100.4167, province_id:2 },
      { id:4, name_th:'ເມືອງປາກຊັນ', name_en:'Pakxan', lat:18.3667, lon:103.6667, province_id:1 },
      { id:5, name_th:'ເມືອງປາກເຊ', name_en:'Pakse', lat:15.1167, lon:105.8167, province_id:3 },
      { id:6, name_th:'ເມືອງຊໍາເໜືອ', name_en:'Sam Neua', lat:20.4167, lon:104.05, province_id:2 },
      { id:7, name_th:'ເມືອງທ່າແຂກ', name_en:'Thakhek', lat:17.4, lon:104.8, province_id:1 },
      { id:8, name_th:'ເມືອງຫລວງນໍ້າທາ', name_en:'Luang Namtha', lat:20.95, lon:101.4, province_id:2 },
      { id:9, name_th:'ເມືອງຫລວງພະບາງ', name_en:'Luang Prabang', lat:19.8856, lon:102.1347, province_id:2 },
      { id:10, name_th:'ເມືອງໄຊ', name_en:'Xai', lat:20.6833, lon:101.9833, province_id:2 },
      { id:11, name_th:'ເມືອງຜົ້ງສາລີ', name_en:'Phongsaly', lat:21.683, lon:101.95, province_id:2 },
      { id:12, name_th:'ເມືອງສາລະວັນ', name_en:'Saravane', lat:15.7167, lon:106.4167, province_id:3 },
      { id:13, name_th:'ເມືອງໄກສອນພົມວິຫານ', name_en:'Kaisone Phomvihane', lat:16.5667, lon:104.75, province_id:1 },
      { id:14, name_th:'ເມືອງລະມາມ', name_en:'Lamam', lat:15.35, lon:106.7167, province_id:3 },
      { id:15, name_th:'ເມືອງໂພນໂຮງ', name_en:'Phonhong', lat:18.4937, lon:102.4103, province_id:1 },
      { id:16, name_th:'ເມືອງໄຊຍະບູລີ', name_en:'Xaiyabouli', lat:19.25, lon:101.75, province_id:2 },
      { id:17, name_th:'ເມືອງໂພນສະຫວັນ', name_en:'Phonsavan', lat:19.45, lon:103.1833, province_id:2 },
      { id:18, name_th:'ເມືອງອະນຸວົງ', name_en:'Anouvong', lat:18.905, lon:103.1, province_id:1 }
    ];

    for (const c of cities) {
      await City.findOrCreate({ where: { id: c.id }, defaults: c });
    }

    // Create sample historical weather records for last 15 days for each city
    const days = 15;
    const now = new Date();

    for (const city of cities) {
      const found = await City.findOne({ where: { id: city.id } });
      if (!found) continue;

      for (let d = days; d >= 1; d--) {
        const ts = new Date(now);
        ts.setDate(now.getDate() - d);

        // simple deterministic synthetic values
        const baseTemp = 25 + (city.id % 5);
        const temperature = baseTemp + (Math.sin(d) * 2);
        const humidity = 60 + (city.id % 10);
        const pressure = 1010 + (city.id % 7);
        const wind_speed = 1 + (city.id % 3);
        const rainfall = Math.abs(Math.round((Math.sin(d / 2) * 3 + Math.random() * 2) * 10) / 10);

        await Weather.create({
          city_id: city.id,
          timestamp: ts,
          temperature,
          humidity,
          pressure,
          wind_speed,
          rainfall,
          description: 'Seeded historical data'
        });
      }
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
