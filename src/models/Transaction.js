const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    fromAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    toAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['purchase', 'income', 'withdrawal', 'rebirth', 'adminFee'],
        required: true
    },
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    blockNumber: {
        type: Number
    },
    gasUsed: {
        type: Number
    },
    errorMessage: {
        type: String
    },
    transactionDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
transactionSchema.index({ fromAddress: 1 });
transactionSchema.index({ toAddress: 1 });
transactionSchema.index({ transactionType: 1 });
transactionSchema.index({ relatedUser: 1 });
transactionSchema.index({ transactionDate: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);