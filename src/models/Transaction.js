const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  fromAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  toAddress: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transactionType: {
    type: String,
    enum: ['purchase', 'income', 'withdrawal', 'rebirth', 'adminFee'],
    required: true,
    index: true
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
    index: true
  },
  blockNumber: {
    type: Number,
    default: null
  },
  gasUsed: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    trim: true,
    default: null
  },
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for performance (some are also declared inline above)
transactionSchema.index({ transactionDate: -1 });

/**
 * Static method to record a transaction atomically.
 * @param {Object} transactionData - The transaction details.
 * @returns {Promise<Document>} - Returns the saved Transaction document.
 */
transactionSchema.statics.recordTransaction = async function(transactionData) {
  // Defensive trimming for string fields
  if (transactionData.transactionHash) {
    transactionData.transactionHash = transactionData.transactionHash.trim();
  }
  if (transactionData.fromAddress) {
    transactionData.fromAddress = transactionData.fromAddress.trim().toLowerCase();
  }
  if (transactionData.toAddress) {
    transactionData.toAddress = transactionData.toAddress.trim().toLowerCase();
  }
  if (transactionData.description) {
    transactionData.description = transactionData.description.trim();
  }
  if (transactionData.errorMessage) {
    transactionData.errorMessage = transactionData.errorMessage.trim();
  }

  const transaction = new this(transactionData);
  return transaction.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);
// This model defines a Transaction schema for MongoDB using Mongoose.
// It includes fields for transaction details, user references, and atomic methods for recording transactions.
// It also includes indexes for efficient querying by transaction hash, addresses, and dates.
// The schema supports various transaction types and statuses, allowing for comprehensive tracking of blockchain transactions.  