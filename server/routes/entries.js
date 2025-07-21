const express = require('express');
const Entry = require('../models/Entry');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, canModifyEntry, rateLimiter } = require('../middleware/auth');
const { getFinancialYear } = require('../utils/helpers');

const router = express.Router();

// Apply rate limiting to all entry routes
router.use(rateLimiter(50, 15 * 60 * 1000)); // 50 requests per 15 minutes

// Get all entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'SL_NO', sortOrder = 'desc' } = req.query;
    
    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { USER_NAME: { $regex: search, $options: 'i' } },
          { PARTICULARS: { $regex: search, $options: 'i' } },
          { CLIENT_CODE: { $regex: search, $options: 'i' } },
          { SITE_NAME: { $regex: search, $options: 'i' } },
          { REFERENCE_CODE: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortObj
    };
    
    const entries = await Entry.find(searchQuery)
      .sort(sortObj)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);
    
    const total = await Entry.countDocuments(searchQuery);
    
    res.json({
      entries,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { PARTICULARS, CLIENT_CODE, CAPACITY_MW, SITE_NAME } = req.body;
    
    // Validation
    if (!PARTICULARS || !CLIENT_CODE || !CAPACITY_MW || !SITE_NAME) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (CLIENT_CODE.length !== 4 || SITE_NAME.length !== 4) {
      return res.status(400).json({ error: 'CLIENT_CODE and SITE_NAME must be exactly 4 characters' });
    }
    
    if (CAPACITY_MW <= 0) {
      return res.status(400).json({ error: 'CAPACITY_MW must be positive' });
    }
    
    // Get next SL_NO
    const nextSlNo = await Entry.getNextSlNo();
    
    // Get financial year and incremental number
    const currentFY = getFinancialYear();
    const incrementalNumber = await Entry.getIncrementalNumber(currentFY);
    
    // Generate cumulative number
    const fyLastTwoDigits = currentFY.toString().slice(-2);
    const cumulativeNumber = fyLastTwoDigits + nextSlNo;
    
    // Create entry
    const entry = new Entry({
      SL_NO: nextSlNo,
      USER_NAME: req.user.username,
      PARTICULARS: PARTICULARS.toUpperCase(),
      CLIENT_CODE: CLIENT_CODE.toUpperCase(),
      CAPACITY_MW,
      SITE_NAME: SITE_NAME.toUpperCase(),
      CUMULATIVE_NUMBER: cumulativeNumber,
      INCREMENTAL_NUMBER: incrementalNumber,
      CREATED_BY: req.user.username
    });
    
    // Generate and set reference code
    entry.generateReferenceCode();
    
    await entry.save();
    
    // Create audit log
    await AuditLog.logEntryAction('CREATE', entry._id, req.user.username, null, entry.toObject(), req);
    
    console.log(`✅ Entry created by ${req.user.username}: ${entry.REFERENCE_CODE}`);
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update entry
router.put('/:id', authenticateToken, canModifyEntry, async (req, res) => {
  try {
    const entry = req.entry; // Set by canModifyEntry middleware
    const { PARTICULARS, CLIENT_CODE, CAPACITY_MW, SITE_NAME } = req.body;
    
    // Validation
    if (CLIENT_CODE && (CLIENT_CODE.length !== 4)) {
      return res.status(400).json({ error: 'CLIENT_CODE must be exactly 4 characters' });
    }
    
    if (SITE_NAME && (SITE_NAME.length !== 4)) {
      return res.status(400).json({ error: 'SITE_NAME must be exactly 4 characters' });
    }
    
    if (CAPACITY_MW && CAPACITY_MW <= 0) {
      return res.status(400).json({ error: 'CAPACITY_MW must be positive' });
    }
    
    const beforeData = entry.toObject();
    
    // Update fields
    if (PARTICULARS) entry.PARTICULARS = PARTICULARS.toUpperCase();
    if (CLIENT_CODE) entry.CLIENT_CODE = CLIENT_CODE.toUpperCase();
    if (CAPACITY_MW) entry.CAPACITY_MW = CAPACITY_MW;
    if (SITE_NAME) entry.SITE_NAME = SITE_NAME.toUpperCase();
    entry.MODIFIED_BY = req.user.username;
    
    // Regenerate reference code
    entry.generateReferenceCode();
    
    await entry.save();
    
    // Create audit log
    await AuditLog.logEntryAction('UPDATE', entry._id, req.user.username, beforeData, entry.toObject(), req);
    
    console.log(`✅ Entry updated by ${req.user.username}: ${entry.REFERENCE_CODE}`);
    res.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete entry (soft delete - mark as inactive)
router.delete('/:id', authenticateToken, canModifyEntry, async (req, res) => {
  try {
    const entry = req.entry;
    const beforeData = entry.toObject();
    
    // Instead of actual deletion, you might want to add an 'isActive' field
    // For now, we'll do actual deletion as per original code
    await Entry.findByIdAndDelete(req.params.id);
    
    // Create audit log
    await AuditLog.logEntryAction('DELETE', entry._id, req.user.username, beforeData, null, req);
    
    console.log(`✅ Entry deleted by ${req.user.username}: ${entry.REFERENCE_CODE}`);
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get audit trail for entry
router.get('/:id/audit', authenticateToken, async (req, res) => {
  try {
    const auditTrail = await AuditLog.getEntryAuditTrail(req.params.id);
    res.json(auditTrail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;