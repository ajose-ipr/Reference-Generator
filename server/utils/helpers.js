// Financial Year Helper
function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  return date.getMonth() < 3 ? year : year + 1;
}

// Get financial year date range
function getFinancialYearRange(year = null) {
  const fy = year || getFinancialYear();
  return {
    start: new Date(fy - 1, 3, 1), // April 1st
    end: new Date(fy, 2, 31), // March 31st
    year: fy
  };
}

// Format date for display
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    default:
      return d.toISOString();
  }
}

// Validate entry data
function validateEntryData(data) {
  const errors = [];
  
  if (!data.PARTICULARS || data.PARTICULARS.trim().length === 0) {
    errors.push('PARTICULARS is required');
  }
  
  if (!data.CLIENT_CODE || data.CLIENT_CODE.trim().length !== 4) {
    errors.push('CLIENT_CODE must be exactly 4 characters');
  }
  
  if (!data.CAPACITY_MW || data.CAPACITY_MW <= 0) {
    errors.push('CAPACITY_MW must be a positive number');
  }
  
  if (!data.SITE_NAME || data.SITE_NAME.trim().length !== 4) {
    errors.push('SITE_NAME must be exactly 4 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate reference code
function generateReferenceCode(entryData) {
  const {
    PARTICULARS,
    CLIENT_CODE,
    CAPACITY_MW,
    SITE_NAME,
    CUMULATIVE_NUMBER,
    INCREMENTAL_NUMBER
  } = entryData;
  
  return `IPR/${PARTICULARS.toUpperCase()}/${CLIENT_CODE.toUpperCase().slice(0, 3)}/${CAPACITY_MW}MW/${SITE_NAME.toUpperCase()}/${CUMULATIVE_NUMBER}/${INCREMENTAL_NUMBER.toString().padStart(2, '0')}`;
}

// Sanitize input data
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .substring(0, 100); // Limit length
}

// Check if user has permission to modify entry
function canUserModifyEntry(user, entry) {
  return user.role === 'admin' || entry.CREATED_BY === user.username;
}

// Generate pagination metadata
function getPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
}

// Calculate statistics
function calculateStats(entries) {
  if (!entries || entries.length === 0) {
    return {
      total: 0,
      averageCapacity: 0,
      totalCapacity: 0,
      byParticulars: {},
      byClient: {},
      byMonth: {}
    };
  }
  
  const totalCapacity = entries.reduce((sum, entry) => sum + entry.CAPACITY_MW, 0);
  const averageCapacity = totalCapacity / entries.length;
  
  const byParticulars = entries.reduce((acc, entry) => {
    acc[entry.PARTICULARS] = (acc[entry.PARTICULARS] || 0) + 1;
    return acc;
  }, {});
  
  const byClient = entries.reduce((acc, entry) => {
    acc[entry.CLIENT_CODE] = (acc[entry.CLIENT_CODE] || 0) + 1;
    return acc;
  }, {});
  
  const byMonth = entries.reduce((acc, entry) => {
    const month = new Date(entry.CREATED_AT).toISOString().slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: entries.length,
    averageCapacity: Math.round(averageCapacity * 100) / 100,
    totalCapacity,
    byParticulars,
    byClient,
    byMonth
  };
}

// Error response helper
function createErrorResponse(message, status = 500, details = null) {
  const error = {
    error: message,
    timestamp: new Date().toISOString(),
    status
  };
  
  if (details) {
    error.details = details;
  }
  
  return error;
}

// Success response helper
function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getFinancialYear,
  getFinancialYearRange,
  formatDate,
  validateEntryData,
  generateReferenceCode,
  sanitizeInput,
  canUserModifyEntry,
  getPaginationMeta,
  calculateStats,
  createErrorResponse,
  createSuccessResponse
};