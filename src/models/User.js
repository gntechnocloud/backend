const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
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
  
  // Referral System
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
  
  // Matrix Information
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
  
  // Earnings Tracking
  totalEarnings: {
    matrixIncome: { type: Number, default: 0 },
    levelIncome: { type: Number, default: 0 },
    poolIncome: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Slot Status
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
  
  // Team Information
  directReferrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teamSize: {
    direct: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  // Authentication
  nonce: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // Metadata
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

// Indexes for performance
userSchema.index({ walletAddress: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ referredBy: 1 });
userSchema.index({ matrixLevel: 1, currentSlot: 1 });
userSchema.index({ 'activeSlots.slotNumber': 1 });
userSchema.index({ registrationDate: -1 });

// Virtual for referral URL
userSchema.virtual('referralUrl').get(function() {
  return `${process.env.FRONTEND_URL}/register?ref=${this.referralCode}`;
});

// Virtual for total team earnings
userSchema.virtual('totalTeamEarnings').get(function() {
  return this.totalEarnings.matrixIncome + 
         this.totalEarnings.levelIncome + 
         this.totalEarnings.poolIncome;
});

// Methods
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

userSchema.methods.addEarnings = function(type, amount) {
  this.totalEarnings[type] += amount;
  this.totalEarnings.total += amount;
  this.lastActivity = new Date();
  return this.save();
};

userSchema.methods.activateSlot = function(slotNumber) {
  const existingSlot = this.activeSlots.find(slot => slot.slotNumber === slotNumber);
  if (!existingSlot) {
    this.activeSlots.push({
      slotNumber,
      isActive: true,
      purchaseDate: new Date(),
      rebirthCount: 0
    });
  }
  this.currentSlot = Math.max(this.currentSlot, slotNumber);
  this.lastActivity = new Date();
  return this.save();
};

userSchema.methods.processRebirth = function(slotNumber) {
  const slot = this.activeSlots.find(s => s.slotNumber === slotNumber);
  if (slot) {
    slot.rebirthCount += 1;
    slot.purchaseDate = new Date();
  }
  this.lastActivity = new Date();
  return this.save();
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  next();
});

// Static methods
userSchema.statics.findByWallet = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

userSchema.statics.findByReferralCode = function(referralCode) {
  return this.findOne({ referralCode: referralCode.toUpperCase() });
};

userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'totalEarnings.total': -1 })
    .limit(limit)
    .select('username totalEarnings teamSize registrationDate');
};

module.exports = mongoose.model('User', userSchema);