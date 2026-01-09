const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { City } = require('./models');

async function testCityStatus() {
  try {
    console.log('🔧 Testing city status system (using models)...');

    // Set city ID 1 to inactive
    await City.update({ status: 'inactive' }, { where: { id: 1 } });
    console.log('✅ Set city ID 1 to inactive');

    // Check active cities count
    const activeCount = await City.count({ where: { status: 'active' } });
    console.log(`✅ Active cities: ${activeCount}`);

    // Check inactive cities count
    const inactiveCount = await City.count({ where: { status: 'inactive' } });
    console.log(`✅ Inactive cities: ${inactiveCount}`);

    // Set city ID 1 back to active
    await City.update({ status: 'active' }, { where: { id: 1 } });
    console.log('✅ Set city ID 1 back to active');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testCityStatus();
