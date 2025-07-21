const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  SL_NO: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  USER_NAME: { 
    type: String, 
    required: true 
  },
  PARTICULARS: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  CLIENT_CODE: { 
    type: String, 
    required: true, 
    maxlength: 4,
    minlength: 4,
    uppercase: true,
    trim: true
  },
  CAPACITY_MW: { 
    type: Number, 
    required: true,
    min: 0.1
  },
  SITE_NAME: { 
    type: String, 
    required: true, 
    maxlength: 4,
    minlength: 4,
    uppercase: true,
    trim: true
  },
  CUMULATIVE_NUMBER: { 
    type: String, 
    required: true 
  },
  INCREMENTAL_NUMBER: { 
    type: Number, 
    required: true,
    min: 1
  },
  REFERENCE_CODE: { 
    type: String, 
    required: true,
    unique: true
  },
  CREATED_AT: { 
    type: Date, 
    default: Date.now 
  },
  CREATED_BY: { 
    type: String, 
    required: true 
  },
  LAST_MODIFIED: { 
    type: Date, 
    default: Date.now 
  },
  MODIFIED_BY: { 
    type: String, 
    default: null 
  }
});

// Update LAST_MODIFIED on save
entrySchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.LAST_MODIFIED = new Date();
  }
  next();
});

// Static method to get next SL_NO
entrySchema.statics.getNextSlNo = async function() {
  const lastEntry = await this.findOne().sort({ SL_NO: -1 });
  return lastEntry ? lastEntry.SL_NO + 1 : 1;
};

// Static method to get incremental number for financial year
entrySchema.statics.getIncrementalNumber = async function(financialYear) {
  const fyStart = new Date(financialYear - 1, 3, 1); // April 1st
  const fyEnd = new Date(financialYear, 2, 31); // March 31st
  
  const count = await this.countDocuments({
    CREATED_AT: { $gte: fyStart, $lte: fyEnd }
  });
  
  return count + 1;
};

// Instance method to generate reference code
entrySchema.methods.generateReferenceCode = function() {
  const code = `IPR/${this.PARTICULARS}/${this.CLIENT_CODE.slice(0, 3)}/${this.CAPACITY_MW}MW/${this.SITE_NAME}/${this.CUMULATIVE_NUMBER}/${this.INCREMENTAL_NUMBER.toString().padStart(2, '0')}`;
  this.REFERENCE_CODE = code;
  return code;
};

module.exports = mongoose.model('Entry', entrySchema);