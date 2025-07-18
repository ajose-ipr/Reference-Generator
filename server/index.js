// Load environment variables first
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection - FIXED: Use MONGODB_URI instead of MONGO_URI
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reference_generator')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Debug logging
console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Missing');