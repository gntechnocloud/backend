const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    incomeType: {
        type: String,
        enum: ['matrix', 'level', 'pool'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    transactionHash: {
        type: String,
        index: true
    },
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    slotNumber: {
        type: Number
    },
    levelNumber: {
        type: Number
    },
    incomeDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
incomeSchema.index({ user: 1 });
incomeSchema.index({ incomeType: 1 });
incomeSchema.index({ transactionHash: 1 });
incomeSchema.index({ incomeDate: -1 });

module.exports = mongoose.model('Income', incomeSchema);