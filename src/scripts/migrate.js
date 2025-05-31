const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Slot = require('../models/Slot');
const logger = require('../utils/logger');
const connectDB = require('../../config/db');


async function migrateData() {
    try {
        await connectDB();
        logger.info('Database connected for migration');

        // 1. Ensure default slots are created
        const defaultSlots = [
            { slotNumber: 1, price: 10, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: false, description: 'Entry Level Slot' },
            { slotNumber: 2, price: 25, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Beginner Slot' },
            { slotNumber: 3, price: 50, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Intermediate Slot' },
            { slotNumber: 4, price: 100, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Advanced Slot' },
            { slotNumber: 5, price: 250, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Expert Slot' },
            { slotNumber: 6, price: 500, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Master Slot' },
            { slotNumber: 7, price: 1000, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Grand Master Slot' },
            { slotNumber: 8, price: 2500, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Elite Slot' },
            { slotNumber: 9, price: 5000, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Legendary Slot' },
            { slotNumber: 10, price: 10000, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Mythic Slot' },
            { slotNumber: 11, price: 25000, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Godlike Slot' },
            { slotNumber: 12, price: 50000, matrixIncomePercentage: 50, levelIncomePercentage: 30, poolIncomePercentage: 20, rebirthRequired: true, description: 'Ultimate Slot' }
        ];

        for (const slotData of defaultSlots) {
            const existingSlot = await Slot.findOne({ slotNumber: slotData.slotNumber });
            if (!existingSlot) {
                const newSlot = new Slot(slotData);
                await newSlot.save();
                logger.info(`Created default slot: ${newSlot.slotNumber}`);
            } else {
                logger.info(`Slot ${slotData.slotNumber} already exists`);
            }
        }

        // 2. Add any other data migrations here

        logger.info('Data migration completed successfully');
        mongoose.connection.close();
    } catch (error) {
        logger.error('Data migration failed:', error);
        process.exit(1);
    }
}

migrateData();