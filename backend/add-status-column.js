const sequelize = require('./config/database');

async function addStatusColumn() {
  try {
    console.log('🔧 Adding status column to cities table...');
    
    await sequelize.query(`
      ALTER TABLE cities 
      ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active'
    `);
    
    console.log('✅ Successfully added status column to cities table');
    
    // Set all existing cities to active
    await sequelize.query(`
      UPDATE cities SET status = 'active' WHERE status IS NULL
    `);
    
    console.log('✅ Set all existing cities to active status');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ Status column already exists');
    } else {
      console.error('❌ Error adding status column:', error.message);
    }
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addStatusColumn();
