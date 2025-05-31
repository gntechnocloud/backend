const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Slot = require('../models/Slot');
const logger = require('../utils/logger');

async function getPlatformStats(req, res) {
    try {
        const totalUsers = await User.countDocuments({ isActive: true });
        const totalTransactions = await Transaction.countDocuments();
        const totalSlotsPurchased = await Slot.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$purchaseCount' }
                }
            }
        ]);
        const totalEarningsDistributed = await User.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalEarnings.total' }
                }
            }
        ]);

        const stats = {
            totalUsers,
            totalTransactions,
            totalSlotsPurchased: totalSlotsPurchased.length > 0 ? totalSlotsPurchased[0].total : 0,
            totalEarningsDistributed: totalEarningsDistributed.length > 0 ? totalEarningsDistributed[0].total : 0,
            timestamp: new Date().toISOString()
        };

        res.json(stats);
    } catch (error) {
        logger.error('Error fetching platform stats:', error);
        res.status(500).json({ message: 'Failed to fetch platform statistics', error: error.message });
    }
}

async function getLeaderboard(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await User.getLeaderboard(limit);
        res.json(leaderboard);
    } catch (error) {
        logger.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
    }
}

async function searchUsers(req, res) {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.status(400).json({ message: 'Search term is required' });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: searchTerm, $options: 'i' } },
                { walletAddress: { $regex: searchTerm, $options: 'i' } }
            ]
        }).limit(20);

        res.json(users);
    } catch (error) {
        logger.error('Error searching users:', error);
        res.status(500).json({ message: 'Failed to search users', error: error.message });
    }
}

async function getActivityFeed(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const transactions = await Transaction.find()
            .sort({ transactionDate: -1 })
            .limit(limit)
            .populate('relatedUser', 'username walletAddress');

        res.json(transactions);
    } catch (error) {
        logger.error('Error fetching activity feed:', error);
        res.status(500).json({ message: 'Failed to fetch activity feed', error: error.message });
    }
}

module.exports = {
    getPlatformStats,
    getLeaderboard,
    searchUsers,
    getActivityFeed
};