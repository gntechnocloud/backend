//const reownService = require('../services/reownService');
const Slot = require('../models/Slot');
const User = require('../models/User');
const logger = require('../utils/logger');

async function getAllSlots(req, res) {
    try {
        const slots = await Slot.find({ isActive: true }).sort({ slotNumber: 1 });
        res.json(slots);
    } catch (error) {
        logger.error('Failed to fetch slots', error);
        res.status(500).json({ message: 'Failed to fetch slots', error: error.message });
    }
}

async function getSlotByNumber(req, res) {
    try {
        const slot = await Slot.findOne({ slotNumber: req.params.slotNumber });
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        res.json(slot);
    } catch (error) {
        logger.error('Failed to fetch slot', error);
        res.status(500).json({ message: 'Failed to fetch slot', error: error.message });
    }
}

async function checkEligibility(req, res) {
    try {
        const user = await User.findById(req.user.userId);
        const slotNumber = parseInt(req.params.slotNumber);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Example: user must have previous slot active
        if (slotNumber > 1) {
            const prevSlot = user.activeSlots.find(s => s.slotNumber === slotNumber - 1 && s.isActive);
            if (!prevSlot) {
                return res.status(400).json({ eligible: false, message: 'Previous slot not active' });
            }
        }
        res.json({ eligible: true });
    } catch (error) {
        logger.error('Eligibility check failed', error);
        res.status(500).json({ message: 'Eligibility check failed', error: error.message });
    }
}

/* async function purchaseSlot(req, res) {
    const userAddress = req.user.walletAddress;
    const slotNumber = parseInt(req.body.slotNumber);

    try {
        const tx = await reownService.purchaseSlot(userAddress, slotNumber);

        // Optionally send notification
        await reownService.sendNotification(
            userAddress,
            'Slot Purchased',
            `You have successfully purchased slot number ${slotNumber}.`
        );

        res.json({ message: 'Slot purchased successfully', transactionHash: tx.hash });
    } catch (error) {
        logger.error('Failed to purchase slot', error);
        res.status(500).json({ message: 'Failed to purchase slot', error: error.message });
    }
} */

    async function purchaseSlot(req, res) {
        const userAddress = req.user.walletAddress;
        const slotNumber = parseInt(req.body.slotNumber);
        const txHash = req.body.txHash; // sent from frontend
    
        try {
            if (!txHash) {
                return res.status(400).json({ message: 'Transaction hash is required' });
            }
    
            // Optionally store or log the purchase in DB
            logger.info(`Slot ${slotNumber} purchased by ${userAddress}, tx: ${txHash}`);
    
            res.json({ message: 'Slot purchase acknowledged', transactionHash: txHash });
        } catch (error) {
            logger.error('Failed to acknowledge slot purchase', error);
            res.status(500).json({ message: 'Failed to process slot purchase', error: error.message });
        }
    }
    
module.exports = {
    getAllSlots,
    getSlotByNumber,
    checkEligibility,
    purchaseSlot
};