const bcrypt = require('bcrypt');
const User = require('../models/User');
const DropdownOption = require('../models/DropdownOption');

// Initialize default data
async function initializeDefaults() {
  try {
    console.log('🔄 Initializing default data...');
    
    await createDefaultAdmin();
    await createDefaultDropdownOptions();
    
    console.log('✨ Application ready!');
  } catch (error) {
    console.error('❌ Error initializing defaults:', error);
  }
}

// Create default admin user
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('👤 Admin user created (username: admin, password: admin123)');
      console.log('⚠️  Please change the default admin password immediately!');
    } else {
      console.log('👤 Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Create default dropdown options
async function createDefaultDropdownOptions() {
  try {
    // Default PARTICULARS options
    const defaultParticulars = ['TC', 'GC', 'PQM', 'EVF', 'OPT', 'PS', 'SS'];
    
    for (const particular of defaultParticulars) {
      await DropdownOption.findOneAndUpdate(
        { type: 'PARTICULARS', value: particular },
        { 
          type: 'PARTICULARS', 
          value: particular, 
          isCustom: false, 
          createdBy: 'system',
          isActive: true
        },
        { upsert: true }
      );
    }
    
    // Default CLIENT_CODE options
    const defaultClients = ['HFEX', 'ADN', 'HEXA', 'GE'];
    
    for (const client of defaultClients) {
      await DropdownOption.findOneAndUpdate(
        { type: 'CLIENT_CODE', value: client },
        { 
          type: 'CLIENT_CODE', 
          value: client, 
          isCustom: false, 
          createdBy: 'system',
          isActive: true
        },
        { upsert: true }
      );
    }
    
    // Default SITE_NAME options (examples)
    const defaultSites = ['SITE', 'MAIN', 'GRID', 'SUBJ'];
    
    for (const site of defaultSites) {
      await DropdownOption.findOneAndUpdate(
        { type: 'SITE_NAME', value: site },
        { 
          type: 'SITE_NAME', 
          value: site, 
          isCustom: false, 
          createdBy: 'system',
          isActive: true
        },
        { upsert: true }
      );
    }
    
    console.log('📋 Dropdown options initialized');
    console.log(`   - PARTICULARS: ${defaultParticulars.join(', ')}`);
    console.log(`   - CLIENT_CODE: ${defaultClients.join(', ')}`);
    console.log(`   - SITE_NAME: ${defaultSites.join(', ')}`);
  } catch (error) {
    console.error('❌ Error creating dropdown options:', error);
  }
}

// Create sample entries (for testing)
async function createSampleEntries() {
  try {
    const Entry = require('../models/Entry');
    const AuditLog = require('../models/AuditLog');
    const { getFinancialYear } = require('./helpers');
    
    const entryCount = await Entry.countDocuments();
    if (entryCount > 0) {
      console.log('📝 Sample entries already exist, skipping creation');
      return;
    }
    
    console.log('🔄 Creating sample entries...');
    
    const sampleData = [
      {
        PARTICULARS: 'TC',
        CLIENT_CODE: 'HFEX',
        CAPACITY_MW: 100,
        SITE_NAME: 'MAIN'
      },
      {
        PARTICULARS: 'GC',
        CLIENT_CODE: 'ADN',
        CAPACITY_MW: 50,
        SITE_NAME: 'GRID'
      },
      {
        PARTICULARS: 'PQM',
        CLIENT_CODE: 'HEXA',
        CAPACITY_MW: 75,
        SITE_NAME: 'SUBJ'
      }
    ];
    
    for (let i = 0; i < sampleData.length; i++) {
      const data = sampleData[i];
      const currentFY = getFinancialYear();
      
      const entry = new Entry({
        SL_NO: i + 1,
        USER_NAME: 'admin',
        PARTICULARS: data.PARTICULARS,
        CLIENT_CODE: data.CLIENT_CODE,
        CAPACITY_MW: data.CAPACITY_MW,
        SITE_NAME: data.SITE_NAME,
        CUMULATIVE_NUMBER: `${currentFY.toString().slice(-2)}${i + 1}`,
        INCREMENTAL_NUMBER: i + 1,
        CREATED_BY: 'admin'
      });
      
      // Generate reference code
      entry.generateReferenceCode();
      
      await entry.save();
      
      // Create audit log
      await AuditLog.logEntryAction('CREATE', entry._id, 'admin', null, entry.toObject());
    }
    
    console.log(`📝 Created ${sampleData.length} sample entries`);
  } catch (error) {
    console.error('❌ Error creating sample entries:', error);
  }
}

// Reset database (use with caution!)
async function resetDatabase() {
  try {
    console.log('⚠️  Resetting database...');
    
    const Entry = require('../models/Entry');
    const AuditLog = require('../models/AuditLog');
    
    await Entry.deleteMany({});
    await DropdownOption.deleteMany({ isCustom: true });
    await AuditLog.deleteMany({});
    await User.deleteMany({ username: { $ne: 'admin' } });
    
    console.log('🗑️  Database reset complete');
    
    // Reinitialize defaults
    await initializeDefaults();
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
}

// Database health check
async function checkDatabaseHealth() {
  try {
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    const stats = {
      users: await User.countDocuments(),
      entries: await Entry.countDocuments(),
      dropdownOptions: await DropdownOption.countDocuments(),
      auditLogs: await AuditLog.countDocuments(),
      adminExists: !!(await User.findOne({ role: 'admin' }))
    };
    
    console.log('📊 Database Health Check:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    throw error;
  }
}

module.exports = {
  initializeDefaults,
  createDefaultAdmin,
  createDefaultDropdownOptions,
  createSampleEntries,
  resetDatabase,
  checkDatabaseHealth
};