const User = require('../models/User');
const Income = require('../models/Income');
const Slot = require('../models/Slot');

async function getProfile(req, res) {
    try {
        const user = await User.findById(req.user.userId)
            .populate('referredBy', 'username walletAddress')
            .populate('directReferrals', 'username walletAddress');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
}

async function getEarnings(req, res) {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.totalEarnings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch earnings', error: error.message });
    }
}

async function getReferralTree(req, res) {
    try {
        const user = await User.findById(req.user.userId).populate('directReferrals');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Simple 2-level tree
        const tree = {
            user: user.username,
            referrals: []
        };
        for (const ref of user.directReferrals) {
            const subUser = await User.findById(ref._id).populate('directReferrals');
            tree.referrals.push({
                user: subUser.username,
                referrals: subUser.directReferrals.map(u => u.username)
            });
        }
        res.json(tree);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch referral tree', error: error.message });
    }
}

async function getSlotStatus(req, res) {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.activeSlots);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch slot status', error: error.message });
    }
}

async function getIncomeHistory(req, res) {
    try {
        const incomes = await Income.find({ user: req.user.userId }).sort({ createdAt: -1 }).limit(100);
        res.json(incomes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch income history', error: error.message });
    }
}

module.exports = {
    getProfile,
    getEarnings,
    getReferralTree,
    getSlotStatus,
    getIncomeHistory
};