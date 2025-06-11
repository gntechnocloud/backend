const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  incomeType: {
    type: String,
    enum: ['matrix', 'level', 'pool'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  transactionHash: {
    type: String,
    index: true,
    trim: true,
    sparse: true // allow multiple docs without this field
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  slotNumber: {
    type: Number,
    min: 1,
    max: 12,
    default: null
  },
  levelNumber: {
    type: Number,
    min: 1,
    default: null
  },
  incomeDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for performance
incomeSchema.index({ user: 1 });
incomeSchema.index({ incomeType: 1 });
incomeSchema.index({ transactionHash: 1 });
incomeSchema.index({ incomeDate: -1 });

/**
 * Static method to add a new income record atomically.
 * @param {Object} incomeData - The income details.
 * @returns {Promise<Document>} - Returns the saved Income document.
 */
incomeSchema.statics.addIncomeRecord = function (incomeData) {
  // Defensive trim for transactionHash & description if provided
  if (incomeData.transactionHash) {
    incomeData.transactionHash = incomeData.transactionHash.trim();
  }
  if (incomeData.description) {
    incomeData.description = incomeData.description.trim();
  }
  const income = new this(incomeData);
  return income.save();
};

module.exports = mongoose.model('Income', incomeSchema);
// This schema defines the Income model for tracking user earnings in the system.
// It includes fields for user, income type, amount, transaction details, and timestamps.
// The static method `addIncomeRecord` allows for atomic insertion of new income records,
// ensuring that all necessary fields are provided and trimmed for consistency.
// This model is designed to handle various types of income, such as matrix earnings, level completions, and pool distributions.
// It also includes indexes for efficient querying by user, income type, transaction hash, and income date.
//   });
//   res.status(404).json({ message: 'API endpoint not found' });