const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ 
      username, 
      password: hashedPassword,
      role 
    });
    await user.save();
    
    // Generate token for the new user
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '30m' }
    );
    
    console.log('✅ User registered:', username);
    res.status(201).json({ 
      token,
      user: { 
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔐 Login attempt for:', username);
    
    const user = await User.findOne({ username });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      console.log('❌ Invalid credentials for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '30m' }
    );
    
    console.log('✅ Login successful for:', username);
    res.json({ 
      token, 
      user: { 
        id: user._id,
        username: user.username, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('🚨 Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user (for token verification)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      user: { 
        id: user._id, 
        username: user.username,
        role: user.role
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;