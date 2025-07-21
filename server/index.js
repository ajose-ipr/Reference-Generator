const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const entryRoutes = require('./routes/entries');
const dropdownRoutes = require('./routes/dropdown');
const exportRoutes = require('./routes/export');

// Import utilities
const { initializeDefaults } = require('./utils/initialize');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// MongoDB connection with debug logging
mongoose.set('debug', true);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reference_generator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  console.log('📍 Database:', mongoose.connection.db.databaseName);
  initializeDefaults();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.error('Full error:', error);
});

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🚨 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/dropdown-options', dropdownRoutes);
app.use('/api/export', exportRoutes);

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('🔄 Waiting for MongoDB connection...');
});