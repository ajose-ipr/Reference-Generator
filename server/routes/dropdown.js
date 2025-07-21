const express = require('express');
const DropdownOption = require('../models/DropdownOption');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get dropdown options by type
router.get('/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['PARTICULARS', 'CLIENT_CODE', 'SITE_NAME'];
    
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid dropdown type' });
    }
    
    const options = await DropdownOption.getByType(type);
    res.json(options);
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new dropdown option
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, value } = req.body;
    
    if (!type || !value) {
      return res.status(400).json({ error: 'Type and value are required' });
    }
    
    const validTypes = ['PARTICULARS', 'CLIENT_CODE', 'SITE_NAME'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid dropdown type' });
    }
    
    // Validate value length for certain types
    if ((type.toUpperCase() === 'CLIENT_CODE' || type.toUpperCase() === 'SITE_NAME') && value.length !== 4) {
      return res.status(400).json({ error: `${type} must be exactly 4 characters` });
    }
    
    const option = await DropdownOption.addOption(type, value, req.user.username, true);
    
    console.log(`✅ Dropdown option added by ${req.user.username}: ${type} - ${value}`);
    res.status(201).json(option);
  } catch (error) {
    if (error.message === 'Option already exists') {
      return res.status(400).json({ error: 'Option already exists' });
    }
    console.error('Error adding dropdown option:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update dropdown option (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { value, isActive } = req.body;
    
    const option = await DropdownOption.findById(req.params.id);
    if (!option) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    if (value !== undefined) {
      option.value = value.toUpperCase();
    }
    if (isActive !== undefined) {
      option.isActive = isActive;
    }
    
    await option.save();
    
    console.log(`✅ Dropdown option updated by ${req.user.username}: ${option.type} - ${option.value}`);
    res.json(option);
  } catch (error) {
    console.error('Error updating dropdown option:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deactivate dropdown option (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const option = await DropdownOption.findById(req.params.id);
    if (!option) {
      return res.status(404).json({ error: 'Option not found' });
    }
    
    // Don't allow deletion of system options
    if (!option.isCustom) {
      return res.status(403).json({ error: 'Cannot delete system options' });
    }
    
    await option.deactivate();
    
    console.log(`✅ Dropdown option deactivated by ${req.user.username}: ${option.type} - ${option.value}`);
    res.json({ message: 'Option deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating dropdown option:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all dropdown options (admin only - for management)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, includeInactive = false } = req.query;
    
    let query = {};
    if (type) {
      query.type = type.toUpperCase();
    }
    if (!includeInactive) {
      query.isActive = true;
    }
    
    const options = await DropdownOption.find(query).sort({ type: 1, value: 1 });
    res.json(options);
  } catch (error) {
    console.error('Error fetching all dropdown options:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;