const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  matrixLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 12
  },
  currentSlot: {
    type: Number,
    default: 1,
    min: 1,
    max: 12
  },

  totalEarnings: {
    matrixIncome: { type: Number, default: 0 },
    levelIncome: { type: Number, default: 0 },
    poolIncome: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  activeSlots: [{
    slotNumber: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    purchaseDate: { type: Date, default: Date.now },
    rebirthCount: { type: Number, default: 0 },
    matrixPosition: {
      level: Number,
      position: Number
    }
  }],

  directReferrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teamSize: {
    direct: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  nonce: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },

  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ walletAddress: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ referredBy: 1 });
userSchema.index({ matrixLevel: 1, currentSlot: 1 });
userSchema.index({ 'activeSlots.slotNumber': 1 });
userSchema.index({ registrationDate: -1 });

// Virtuals
userSchema.virtual('referralUrl').get(function () {
  return `${process.env.FRONTEND_URL}/register?ref=${this.referralCode}`;
});

userSchema.virtual('totalTeamEarnings').get(function () {
  return this.totalEarnings.matrixIncome +
    this.totalEarnings.levelIncome +
    this.totalEarnings.poolIncome;
});

// Generate referral code - instance method
userSchema.methods.generateReferralCode = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// --- ATOMIC OPERATIONS ---

/**
 * Atomically increment earnings and total
 * @param {string} walletAddress - User wallet address (lowercase)
 * @param {string} type - 'matrixIncome', 'levelIncome', or 'poolIncome'
 * @param {number} amount - Amount to increment
 * @returns {Promise}
 */
userSchema.statics.incEarnings = function (walletAddress, type, amount) {
  if (!['matrixIncome', 'levelIncome', 'poolIncome'].includes(type)) {
    return Promise.reject(new Error(`Invalid earnings type: ${type}`));
  }

  // Use $inc for earnings and total, $set for lastActivity date
  const incFields = {
    [`totalEarnings.${type}`]: amount,
    'totalEarnings.total': amount
  };

  return this.updateOne(
    { walletAddress: walletAddress.toLowerCase() },
    {
      $inc: incFields,
      $set: { lastActivity: new Date() }
    }
  ).exec();
};

/**
 * Atomically activate a slot for user (add slot if not exists)
 * @param {string} walletAddress 
 * @param {number} slotNumber 
 * @returns {Promise}
 */
userSchema.statics.activateSlotAtomic = function (walletAddress, slotNumber) {
  return this.updateOne(
    { walletAddress: walletAddress.toLowerCase(), 'activeSlots.slotNumber': { $ne: slotNumber } },
    {
      $push: {
        activeSlots: {
          slotNumber,
          isActive: true,
          purchaseDate: new Date(),
          rebirthCount: 0
        }
      },
      $set: {
        currentSlot: slotNumber,
        lastActivity: new Date()
      }
    }
  ).exec()
  .then(res => {
    // If the slot was already active, update currentSlot if slotNumber > currentSlot
    if (res.modifiedCount === 0) {
      return this.updateOne(
        { walletAddress: walletAddress.toLowerCase(), currentSlot: { $lt: slotNumber } },
        { $set: { currentSlot: slotNumber, lastActivity: new Date() } }
      ).exec();
    }
    return res;
  });
};

/**
 * Atomically increment rebirth count and update purchaseDate for a slot
 * @param {string} walletAddress 
 * @param {number} slotNumber 
 * @returns {Promise}
 */
userSchema.statics.incrementRebirth = function (walletAddress, slotNumber) {
  return this.updateOne(
    {
      walletAddress: walletAddress.toLowerCase(),
      'activeSlots.slotNumber': slotNumber
    },
    {
      $inc: { 'activeSlots.$.rebirthCount': 1 },
      $set: { 'activeSlots.$.purchaseDate': new Date(), lastActivity: new Date() }
    }
  ).exec();
};

// --- Existing instance methods updated to async and atomic internally ---

userSchema.methods.addEarnings = async function (type, amount) {
  await this.constructor.incEarnings(this.walletAddress, type, amount);
};

userSchema.methods.activateSlot = async function (slotNumber) {
  await this.constructor.activateSlotAtomic(this.walletAddress, slotNumber);
};

userSchema.methods.processRebirth = async function (slotNumber) {
  await this.constructor.incrementRebirth(this.walletAddress, slotNumber);
};

// Pre-save to generate referralCode if not present
userSchema.pre('save', function (next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  next();
});

// Static finders
userSchema.statics.findByWallet = function (walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() }).exec();
};

userSchema.statics.findByReferralCode = function (referralCode) {
  return this.findOne({ referralCode: referralCode.toUpperCase() }).exec();
};

userSchema.statics.getLeaderboard = function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'totalEarnings.total': -1 })
    .limit(limit)
    .select('username totalEarnings teamSize registrationDate')
    .exec();
};

module.exports = mongoose.model('User', userSchema);
