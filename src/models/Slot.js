const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    slotNumber: {
        type: Number,
        required: true,
        unique: true,
        min: 1,
        max: 12
    },
    price: {
        type: Number,
        required: true
    },
    matrixIncomePercentage: {
        type: Number,
        default: 50
    },
    levelIncomePercentage: {
        type: Number,
        default: 30
    },
    poolIncomePercentage: {
        type: Number,
        default: 20
    },
    rebirthRequired: {
        type: Boolean,
        default: true
    },
    rebirthThreshold: {
        type: Number,
        default: 1000
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    slotImage: {
        type: String
    },
    purchaseCount: {
        type: Number,
        default: 0
    },
    lastPurchaseDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
slotSchema.index({ slotNumber: 1 });
slotSchema.index({ price: 1 });

module.exports = mongoose.model('Slot', slotSchema);